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

    if (error) {
      // Silently handle RLS errors - learned phrases are optional
      if (error.code === '42501' || error.message?.includes('row-level security')) {
        console.warn('Supabase RLS policy blocked read for learned phrases.');
      }
      return [];
    }

    if (!data) return [];

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
      .select('message, role, created_at')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      // Silently handle RLS errors - conversation memory is optional
      if (error.code === '42501' || error.message?.includes('row-level security')) {
        console.warn('Supabase RLS policy blocked read. To fix this, update your RLS policy in Supabase to allow selects for authenticated users.');
      }
      return '';
    }

    if (!data || data.length === 0) return '';

    // Get the last few exchanges to provide better context
    const exchanges = (data as { message?: string; role?: string; created_at?: string }[])
      .slice(0, 6)
      .reverse();

    if (exchanges.length === 0) return '';

    // Build a conversation summary
    const contextParts: string[] = [];
    let lastUserTopic = '';

    for (const exchange of exchanges) {
      const msg = exchange.message?.trim();
      if (!msg || msg.length < 3) continue;

      if (exchange.role === 'user') {
        lastUserTopic = msg;
      }
    }

    if (lastUserTopic) {
      const preview = lastUserTopic.length > 100 ? lastUserTopic.slice(0, 100) + '...' : lastUserTopic;
      contextParts.push(`Last time Boss mentioned: "${preview}"`);
    }

    return contextParts.join('. ');
  } catch (e) {
    console.error('Failed to load conversation context:', e);
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
      // Silently handle RLS policy errors - this is expected if the user hasn't
      // set up the proper RLS policies in their Supabase dashboard
      if (error.code === '42501' || error.message?.includes('row-level security')) {
        console.warn('Supabase RLS policy blocked insert. Conversation memory not saved. To fix this, update your RLS policy in Supabase to allow inserts for authenticated users.');
        return false;
      }
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