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

const DEFAULT_VIDEO_BUCKET = import.meta.env.VITE_VIDEO_STORAGE_BUCKET || 'videos';
const DEFAULT_VIDEO_ASPECT_RATIO = import.meta.env.VITE_VIDEO_ASPECT_RATIO || '9:16';
const VERCEL_AI_GATEWAY_KEY = import.meta.env.VITE_VERCEL_AI_GATEWAY_KEY;
const VERCEL_AI_GATEWAY_URL = import.meta.env.VITE_VERCEL_AI_GATEWAY_URL || 'https://gateway.ai.cloudflare.com';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeAspectRatio(value?: string) {
  const clean = String(value || DEFAULT_VIDEO_ASPECT_RATIO).trim();
  return clean === '16:9' || clean === '9:16' ? clean : '9:16';
}

function base64ToBlob(base64: string, mimeType: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
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
  _ai: any,
  supabase: SupabaseClient,
  args: GenerateAssistantVideoArgs
): Promise<GenerateAssistantVideoResult> {
  const prompt = String(args.prompt || '').trim();
  if (!prompt) throw new Error('Video prompt is required.');

  const imageUrl = args.imageUrl;
  const aspectRatio = normalizeAspectRatio(args.aspectRatio);
  const durationSeconds = 15;

  const payload: any = {
    model: 'bytedance/seedance-2.0-fast',
    prompt,
    aspectRatio,
    duration: durationSeconds,
  };

  if (imageUrl && imageUrl.startsWith('data:')) {
    payload.image = imageUrl;
  }

  if (!VERCEL_AI_GATEWAY_KEY) {
    throw new Error('Vercel AI Gateway key is not configured. Add VITE_VERCEL_AI_GATEWAY_KEY to your environment variables.');
  }

  const response = await fetch(`${VERCEL_AI_GATEWAY_URL}/v1/videos/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VERCEL_AI_GATEWAY_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Video generation failed: ${response.status} ${response.statusText} ${errorText}`);
  }

  const result = await response.json();

  const videoUrl = result.url || result.videoUrl;
  const downloadFilename = `vep-video-${Date.now()}.mp4`;

  if (videoUrl) {
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error(`Failed to download generated video: ${videoResponse.status}`);
    }
    const blob = await videoResponse.blob();
    const mimeType = blob.type || 'video/mp4';

    const stored = await uploadVideoToStorage(supabase, blob, downloadFilename, mimeType);
    return {
      videoUrl: stored.publicUrl,
      downloadFilename,
      mimeType,
      storagePath: stored.storagePath,
      sourceUri: videoUrl,
    };
  }

  throw new Error('No video URL returned from generation.');
}