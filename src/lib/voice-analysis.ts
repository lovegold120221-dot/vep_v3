export interface VoiceProfile {
  id?: string;
  user_id: string;
  voice_pattern: number[];
  gender: 'male' | 'female' | 'unknown';
  sample_count: number;
  created_at: string;
  updated_at: string;
}

export interface EmotionalState {
  energy: number;
  valence: 'positive' | 'neutral' | 'negative';
  excitement: number;
  calm: number;
  stress: number;
  dominant_emotion: string;
}

export interface VoiceAnalysis {
  gender: 'male' | 'female' | 'unknown';
  confidence: number;
  dominantFrequency: number;
  emotionalState: EmotionalState;
  voiceMatchId: string | null;
}

const GENDER_FREQ_RANGES = {
  male: { min: 85, max: 180 },
  female: { min: 165, max: 255 },
};

function estimatePitchFromBands(bands: number[], sampleRate: number = 16000): number {
  if (!bands || bands.length === 0) return 0;
  let weightedSum = 0;
  let totalWeight = 0;
  const binSize = sampleRate / (bands.length * 2);
  for (let i = 0; i < bands.length; i++) {
    const freq = i * binSize;
    if (freq > 60 && freq < 500) {
      weightedSum += freq * bands[i];
      totalWeight += bands[i];
    }
  }
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

function detectGender(dominantFreq: number): { gender: 'male' | 'female' | 'unknown'; confidence: number } {
  if (dominantFreq >= GENDER_FREQ_RANGES.male.min && dominantFreq <= GENDER_FREQ_RANGES.male.max) {
    const mid = (GENDER_FREQ_RANGES.male.min + GENDER_FREQ_RANGES.male.max) / 2;
    const dist = Math.abs(dominantFreq - mid) / (GENDER_FREQ_RANGES.male.max - GENDER_FREQ_RANGES.male.min);
    return { gender: 'male', confidence: Math.max(0.5, 1 - dist) };
  }
  if (dominantFreq >= GENDER_FREQ_RANGES.female.min && dominantFreq <= GENDER_FREQ_RANGES.female.max) {
    const mid = (GENDER_FREQ_RANGES.female.min + GENDER_FREQ_RANGES.female.max) / 2;
    const dist = Math.abs(dominantFreq - mid) / (GENDER_FREQ_RANGES.female.max - GENDER_FREQ_RANGES.female.min);
    return { gender: 'female', confidence: Math.max(0.5, 1 - dist) };
  }
  if (dominantFreq > 500 && dominantFreq < 800) {
    return { gender: 'female', confidence: 0.6 };
  }
  return { gender: 'unknown', confidence: 0 };
}

function analyzeEmotion(bands: number[], level: number, pitch: number): EmotionalState {
  const energy = Math.min(1, level * 1.5);
  const bandSum = bands.reduce((a, b) => a + b, 0);
  const avgBand = bandSum / Math.max(bands.length, 1);
  const spectralCentroid = estimateSpectralCentroid(bands);
  const highFreqRatio = getHighFreqRatio(bands);
  const lowFreqRatio = getLowFreqRatio(bands);

  let excitement = Math.min(1, energy * 1.2 + highFreqRatio * 0.3);
  let stress = 0;
  let calm = 0;

  if (energy > 0.6 && highFreqRatio > 0.4) {
    excitement = Math.min(1, excitement + 0.3);
    stress = Math.min(1, energy - 0.3);
  }
  if (energy < 0.3 && lowFreqRatio > 0.5) {
    calm = Math.min(1, 1 - energy);
    excitement *= 0.5;
  }
  if (pitch > 200 && energy > 0.5) {
    stress = Math.min(1, stress + 0.2);
  }

  let valence: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (excitement > 0.6 && stress < 0.4) valence = 'positive';
  if (stress > 0.6) valence = 'negative';

  let dominant_emotion = 'neutral';
  if (excitement > 0.7 && stress < 0.3) dominant_emotion = 'excited';
  else if (calm > 0.6) dominant_emotion = 'calm';
  else if (stress > 0.6) dominant_emotion = 'stressed';
  else if (energy > 0.7 && highFreqRatio > 0.5) dominant_emotion = 'energetic';
  else if (energy < 0.2) dominant_emotion = 'quiet';

  return { energy, valence, excitement, calm, stress, dominant_emotion };
}

function estimateSpectralCentroid(bands: number[]): number {
  let weightedSum = 0;
  let totalWeight = 0;
  for (let i = 0; i < bands.length; i++) {
    weightedSum += i * bands[i];
    totalWeight += bands[i];
  }
  return totalWeight > 0 ? weightedSum / totalWeight / bands.length : 0;
}

function getHighFreqRatio(bands: number[]): number {
  if (!bands.length) return 0;
  const mid = Math.floor(bands.length * 0.6);
  const highSum = bands.slice(mid).reduce((a, b) => a + b, 0);
  const total = bands.reduce((a, b) => a + b, 0);
  return total > 0 ? highSum / total : 0;
}

function getLowFreqRatio(bands: number[]): number {
  if (!bands.length) return 0;
  const mid = Math.floor(bands.length * 0.4);
  const lowSum = bands.slice(0, mid).reduce((a, b) => a + b, 0);
  const total = bands.reduce((a, b) => a + b, 0);
  return total > 0 ? lowSum / total : 0;
}

function computeDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.pow(a[i] - b[i], 2);
  }
  return Math.sqrt(sum / a.length);
}

export class VoiceAnalyzer {
  private voiceProfileCache: Map<string, number[]> = new Map();
  private currentProfileVector: number[] = [];
  private profileSampleCount = 0;
  private sampleWindow: { bands: number[]; level: number; pitch: number }[] = [];
  private readonly PROFILE_DIM = 32;
  private readonly MIN_SAMPLES = 8;
  private readonly MATCH_THRESHOLD = 0.35;

  setStoredProfile(voicePattern: number[]) {
    if (voicePattern.length === this.PROFILE_DIM) {
      this.voiceProfileCache.set('stored', voicePattern);
    }
  }

  addSample(bands: number[], level: number, pitch: number) {
    this.sampleWindow.push({ bands, level, pitch });
    if (this.sampleWindow.length > 20) {
      this.sampleWindow.shift();
    }
    if (this.sampleWindow.length >= this.MIN_SAMPLES) {
      this.buildProfileVector();
    }
  }

  private buildProfileVector() {
    if (this.sampleWindow.length < this.MIN_SAMPLES) return;

    const avgBands = new Array(this.PROFILE_DIM).fill(0);
    let avgLevel = 0;
    let avgPitch = 0;
    const step = Math.floor(this.sampleWindow.length / this.PROFILE_DIM);

    for (let i = 0; i < this.PROFILE_DIM; i++) {
      const idx = Math.min(i * step, this.sampleWindow.length - 1);
      const sample = this.sampleWindow[idx];
      if (sample) {
        const bandStep = Math.floor(sample.bands.length / this.PROFILE_DIM);
        let bandSum = 0;
        for (let j = 0; j < this.PROFILE_DIM; j++) {
          const bandIdx = Math.min(j * bandStep, sample.bands.length - 1);
          bandSum += sample.bands[bandIdx] || 0;
        }
        avgBands[i] = bandSum / this.PROFILE_DIM;
        avgLevel += sample.level;
        avgPitch += sample.pitch;
      }
    }

    avgLevel /= this.sampleWindow.length;
    avgPitch /= this.sampleWindow.length;

    const normalizedPitch = Math.min(1, Math.max(0, (avgPitch - 80) / 200));
    const normalizedLevel = Math.min(1, avgLevel * 1.5);
    this.currentProfileVector = [...avgBands, normalizedPitch, normalizedLevel];
    this.profileSampleCount++;
  }

  getProfileVector(): number[] {
    return this.currentProfileVector;
  }

  matchProfile(storedProfile: number[]): { match: boolean; confidence: number } {
    if (this.currentProfileVector.length !== storedProfile.length || this.currentProfileVector.length === 0) {
      return { match: false, confidence: 0 };
    }
    const distance = computeDistance(this.currentProfileVector, storedProfile);
    const confidence = Math.max(0, 1 - distance * 2);
    return { match: distance < this.MATCH_THRESHOLD, confidence };
  }

  analyze(bands: number[], level: number): VoiceAnalysis {
    const pitch = estimatePitchFromBands(bands);
    const { gender, confidence: genderConf } = detectGender(pitch);
    const emotionalState = analyzeEmotion(bands, level, pitch);

    let voiceMatchId: string | null = null;
    const storedProfile = this.voiceProfileCache.get('stored');
    if (storedProfile && this.profileSampleCount >= 3) {
      const { match, confidence: matchConf } = this.matchProfile(storedProfile);
      if (match && matchConf > 0.5) {
        voiceMatchId = 'matched_user';
      }
    }

    return {
      gender,
      confidence: genderConf,
      dominantFrequency: pitch,
      emotionalState,
      voiceMatchId,
    };
  }

  reset() {
    this.sampleWindow = [];
    this.currentProfileVector = [];
    this.profileSampleCount = 0;
  }

  getProfileSampleCount(): number {
    return this.profileSampleCount;
  }
}

export function bandsToFeatureVector(bands: number[], targetLen = 32): number[] {
  const result = new Array(targetLen).fill(0);
  if (!bands || bands.length === 0) return result;

  const step = bands.length / targetLen;
  for (let i = 0; i < targetLen; i++) {
    const start = Math.floor(i * step);
    const end = Math.min(Math.floor((i + 1) * step), bands.length);
    let sum = 0;
    for (let j = start; j < end; j++) {
      sum += bands[j];
    }
    result[i] = sum / Math.max(end - start, 1);
  }
  return result;
}