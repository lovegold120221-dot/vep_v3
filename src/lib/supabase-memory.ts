import { supabase } from './supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface LearnedPhrasesResult {
  phrases: string[];
  lastContext: string;
}

export async function loadLearnedPhrases(uid: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('conversation_memory')
      .select('message')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error || !data) return [];

    const phrases: string[] = [];
    const seen = new Set<string>();

    (data as { message?: string }[]).forEach((row) => {
      const text = row.message?.trim();
      if (!text || text.length < 10 || text.length > 200) return;
      const words = text.split(/\s+/);
      if (words.length >= 3 && words.length <= 15) {
        const key = text.toLowerCase().slice(0, 40);
        if (!seen.has(key)) {
          seen.add(key);
          phrases.push(text);
        }
      }
    });

    return phrases;
  } catch (e) {
    console.error('Failed to load learned phrases:', e);
    return [];
  }
}

export async function loadLastConversationContext(uid: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('conversation_memory')
      .select('message, created_at')
      .eq('user_id', uid)
      .eq('role', 'user')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error || !data || data.length === 0) return '';

    const recentMessages = (data as { message?: string }[])
      .map((r) => r.message?.trim())
      .filter(Boolean);

    if (recentMessages.length === 0) return '';

    const lastMsg = recentMessages[0];
    if (!lastMsg || lastMsg.length < 5) return '';

    const preview = lastMsg.length > 80 ? lastMsg.slice(0, 80) + '...' : lastMsg;
    return `Boss mentioned: "${preview}"`;
  } catch (e) {
    return '';
  }
}

export async function saveToSupabaseMemory(
  uid: string,
  email: string,
  role: 'user' | 'model',
  text: string
): Promise<boolean> {
  try {
    const { error } = await supabase.from('conversation_memory').insert({
      user_id: uid,
      user_email: email,
      role,
      message: text,
      created_at: new Date().toISOString(),
    });
    if (error) {
      console.error('Supabase save error:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Supabase save failed:', e);
    return false;
  }
}

export async function saveVoiceProfileData(
  uid: string,
  voicePattern: number[]
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('voice_profiles')
      .upsert(
        {
          user_id: uid,
          voice_pattern: voicePattern,
          gender: 'unknown',
          sample_count: 1,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      console.error('Voice profile save error:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Voice profile save failed:', e);
    return false;
  }
}

export async function loadVoiceProfileData(
  uid: string
): Promise<number[] | null> {
  try {
    const { data, error } = await supabase
      .from('voice_profiles')
      .select('voice_pattern')
      .eq('user_id', uid)
      .single();

    if (error || !data?.voice_pattern) return null;

    const pattern = Array.isArray(data.voice_pattern)
      ? data.voice_pattern
      : JSON.parse(data.voice_pattern as unknown as string);

    if (!Array.isArray(pattern) || pattern.length === 0) return null;

    return pattern.slice(0, 32);
  } catch (e) {
    console.error('Failed to load voice profile:', e);
    return null;
  }
}

export async function updateVoiceProfileGenderData(
  uid: string,
  gender: 'male' | 'female' | 'unknown'
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('voice_profiles')
      .update({
        gender,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', uid);

    return !error;
  } catch (e) {
    return false;
  }
}