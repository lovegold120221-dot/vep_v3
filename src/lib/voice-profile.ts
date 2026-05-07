import { supabase } from './supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import { bandsToFeatureVector } from './voice-analysis';
import type { VoiceProfile } from './voice-analysis';

const VOICE_PROFILES_TABLE = 'voice_profiles';
const DEFAULT_PROFILE_DIM = 32;

export async function saveVoiceProfile(
  supabase: SupabaseClient,
  uid: string,
  voicePattern: number[]
): Promise<boolean> {
  try {
    const embedding = JSON.stringify(voicePattern);
    const { error } = await supabase
      .from(VOICE_PROFILES_TABLE)
      .upsert({
        user_id: uid,
        voice_pattern: voicePattern,
        gender: 'unknown',
        sample_count: 1,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('Failed to save voice profile:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Voice profile save error:', e);
    return false;
  }
}

export async function loadVoiceProfile(
  supabase: SupabaseClient,
  uid: string
): Promise<number[] | null> {
  try {
    const { data, error } = await supabase
      .from(VOICE_PROFILES_TABLE)
      .select('voice_pattern')
      .eq('user_id', uid)
      .single();

    if (error || !data?.voice_pattern) return null;

    const pattern = Array.isArray(data.voice_pattern)
      ? data.voice_pattern
      : JSON.parse(data.voice_pattern as unknown as string);

    if (!Array.isArray(pattern) || pattern.length === 0) return null;

    return pattern.slice(0, DEFAULT_PROFILE_DIM);
  } catch (e) {
    console.error('Failed to load voice profile:', e);
    return null;
  }
}

export async function updateVoiceProfileGender(
  supabase: SupabaseClient,
  uid: string,
  gender: 'male' | 'female' | 'unknown'
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(VOICE_PROFILES_TABLE)
      .update({
        gender,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', uid);

    if (error) return false;
    return true;
  } catch (e) {
    return false;
  }
}

export async function incrementProfileSampleCount(
  supabase: SupabaseClient,
  uid: string
): Promise<void> {
  try {
    const { data } = await supabase
      .from(VOICE_PROFILES_TABLE)
      .select('sample_count')
      .eq('user_id', uid)
      .single();

    if (data) {
      await supabase
        .from(VOICE_PROFILES_TABLE)
        .update({
          sample_count: (data.sample_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', uid);
    }
  } catch (e) {
    // silent fail
  }
}

export async function deleteVoiceProfile(
  supabase: SupabaseClient,
  uid: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(VOICE_PROFILES_TABLE)
      .delete()
      .eq('user_id', uid);

    return !error;
  } catch (e) {
    return false;
  }
}