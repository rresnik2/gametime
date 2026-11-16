import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import type { Database } from './database.types';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
// The publishable key (or legacy anon key) is safe to ship in the app; RLS protects the data.
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// During the static web export there is no `window`, so there is nowhere to keep a session.
const isServer = Platform.OS === 'web' && typeof window === 'undefined';

let client: SupabaseClient<Database> | null = null;

/** The shared Supabase client. Throws if the environment isn't configured (see .env.example). */
export function getSupabase(): SupabaseClient<Database> {
  if (client) return client;
  if (!url || !key) {
    throw new Error(
      'Supabase is not configured. Copy .env.example to .env and fill in ' +
        'EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
    );
  }

  client = createClient<Database>(url, key, {
    auth: {
      storage: isServer ? undefined : AsyncStorage,
      autoRefreshToken: !isServer,
      persistSession: !isServer,
      detectSessionInUrl: Platform.OS === 'web' && !isServer,
    },
  });

  // On native, only refresh the session while the app is in the foreground.
  if (Platform.OS !== 'web') {
    AppState.addEventListener('change', (state) => {
      if (state === 'active') client?.auth.startAutoRefresh();
      else client?.auth.stopAutoRefresh();
    });
  }

  return client;
}
