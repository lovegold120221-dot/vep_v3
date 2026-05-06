import type { GoogleGenAI, GenerateVideosOperation, Image, Video } from '@google/genai';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface GenerateAssistantVideoArgs {
  prompt?: string;
  imageUrl?: string;
  aspectRatio?: string;
  durationSeconds?: number;
  negativePrompt?: string;
  generateAudio?: boolean;
}

export interface GenerateAssistantVideoResult {
  videoUrl: string;
  downloadFilename: string;
  mimeType: string;
  storagePath?: string;
  sourceUri?: string;
  operationName?: string;
}

const DEFAULT_VIDEO_MODEL = import.meta.env.VITE_VIDEO_GENERATION_MODEL || 'veo-3.1-generate-preview';
const DEFAULT_VIDEO_BUCKET = import.meta.env.VITE_VIDEO_STORAGE_BUCKET || 'videos';
const DEFAULT_VIDEO_ASPECT_RATIO = import.meta.env.VITE_VIDEO_ASPECT_RATIO || '9:16';
const DEFAULT_VIDEO_RESOLUTION = import.meta.env.VITE_VIDEO_RESOLUTION || '720p';
const DEFAULT_NEGATIVE_PROMPT =
  'low quality, blurry, distorted, unreadable text, watermark, off-brand, awkward cuts';
const POLL_INTERVAL_MS = Number(import.meta.env.VITE_VIDEO_POLL_INTERVAL_MS || 10000);
const MAX_WAIT_MS = Number(import.meta.env.VITE_VIDEO_MAX_WAIT_MS || 300000);

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeAspectRatio(value?: string) {
  const clean = String(value || DEFAULT_VIDEO_ASPECT_RATIO).trim();
  return clean === '16:9' || clean === '9:16' ? clean : '9:16';
}

function normalizeDuration(value?: number) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return undefined;
  const rounded = Math.round(numeric);
  if (rounded < 1) return undefined;
  return Math.min(rounded, 8);
}

function getDataUrlParts(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) return null;
  return {
    mimeType: match[1] || 'image/jpeg',
    base64: match[2],
  };
}

function base64ToBlob(base64: string, mimeType: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = () => reject(reader.error || new Error('Failed to read blob.'));
    reader.readAsDataURL(blob);
  });
}

async function imageFromUrl(imageUrl?: string): Promise<Image | undefined> {
  const url = String(imageUrl || '').trim();
  if (!url) return undefined;

  if (url.startsWith('data:')) {
    const parts = getDataUrlParts(url);
    if (!parts) throw new Error('Starting image data URL is invalid.');
    return {
      imageBytes: parts.base64,
      mimeType: parts.mimeType,
    };
  }

  if (url.startsWith('gs://')) {
    return { gcsUri: url };
  }

  if (/^https?:\/\//i.test(url)) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Starting image could not be fetched: HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const mimeType = blob.type || 'image/jpeg';
    return {
      imageBytes: await blobToBase64(blob),
      mimeType,
    };
  }

  throw new Error('Starting image must be a data URL, HTTPS URL, or gs:// URI.');
}

function formatOperationError(error: Record<string, unknown>) {
  const message = String(error.message || error.status || 'Video generation failed.');
  const code = error.code ? ` (${error.code})` : '';
  return `${message}${code}`;
}

async function waitForVideoOperation(ai: GoogleGenAI, operation: GenerateVideosOperation) {
  let current = operation;
  const startedAt = Date.now();

  while (!current.done) {
    if (current.error) {
      throw new Error(formatOperationError(current.error));
    }

    if (Date.now() - startedAt > MAX_WAIT_MS) {
      throw new Error(
        `Video generation is still running after ${Math.round(MAX_WAIT_MS / 1000)} seconds. Operation: ${current.name || 'unknown'}`
      );
    }

    await sleep(POLL_INTERVAL_MS);
    current = await ai.operations.getVideosOperation({ operation: current });
  }

  if (current.error) {
    throw new Error(formatOperationError(current.error));
  }

  return current;
}

async function fetchGeneratedVideo(uri: string, mimeType: string) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const headers = new Headers();
  if (apiKey) headers.set('x-goog-api-key', apiKey);

  const response = await fetch(uri, { headers });
  if (!response.ok) {
    throw new Error(`Generated video download failed: HTTP ${response.status}`);
  }

  const blob = await response.blob();
  return blob.type ? blob : new Blob([blob], { type: mimeType });
}

async function getVideoBlob(video: Video, mimeType: string) {
  if (video.videoBytes) {
    return base64ToBlob(video.videoBytes, mimeType);
  }

  if (video.uri && /^https?:\/\//i.test(video.uri)) {
    return fetchGeneratedVideo(video.uri, mimeType);
  }

  return null;
}

async function uploadVideoToStorage(
  supabase: SupabaseClient,
  blob: Blob,
  filename: string,
  mimeType: string
) {
  const storagePath = `outputs/${filename}`;
  const { error } = await supabase.storage
    .from(DEFAULT_VIDEO_BUCKET)
    .upload(storagePath, blob, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Video storage upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(DEFAULT_VIDEO_BUCKET).getPublicUrl(storagePath);
  return {
    storagePath,
    publicUrl: data.publicUrl,
  };
}

export async function generateAssistantVideo(
  ai: GoogleGenAI,
  supabase: SupabaseClient,
  args: GenerateAssistantVideoArgs
): Promise<GenerateAssistantVideoResult> {
  const prompt = String(args.prompt || '').trim();
  if (!prompt) throw new Error('Video prompt is required.');

  const image = await imageFromUrl(args.imageUrl);
  const operation = await ai.models.generateVideos({
    model: DEFAULT_VIDEO_MODEL,
    prompt,
    image,
    config: {
      numberOfVideos: 1,
      aspectRatio: normalizeAspectRatio(args.aspectRatio),
      durationSeconds: normalizeDuration(args.durationSeconds),
      resolution: DEFAULT_VIDEO_RESOLUTION,
      negativePrompt: args.negativePrompt || DEFAULT_NEGATIVE_PROMPT,
      enhancePrompt: true,
      generateAudio: args.generateAudio !== false,
    },
  });

  const completed = await waitForVideoOperation(ai, operation);
  const generated = completed.response?.generatedVideos?.[0];
  const video = generated?.video;
  const filteredReasons = completed.response?.raiMediaFilteredReasons?.join(', ');

  if (!video) {
    throw new Error(filteredReasons || 'No video was returned by the generation model.');
  }

  const mimeType = video.mimeType || 'video/mp4';
  const downloadFilename = `vep-video-${Date.now()}.mp4`;
  const blob = await getVideoBlob(video, mimeType);

  if (blob) {
    const stored = await uploadVideoToStorage(supabase, blob, downloadFilename, mimeType);
    return {
      videoUrl: stored.publicUrl,
      downloadFilename,
      mimeType,
      storagePath: stored.storagePath,
      sourceUri: video.uri,
      operationName: completed.name,
    };
  }

  if (video.uri) {
    return {
      videoUrl: video.uri,
      downloadFilename,
      mimeType,
      sourceUri: video.uri,
      operationName: completed.name,
    };
  }

  throw new Error('Generated video did not include downloadable bytes or a video URI.');
}
