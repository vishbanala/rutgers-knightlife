// Safe Supabase client initialization for React Native
// Using static imports (required by Metro bundler) but lazy initialization

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const SUPABASE_URL = "https://dlplpqxixmzupgtbwqen.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscGxwcXhpeG16dXBndGJ3cWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MDk1NjUsImV4cCI6MjA3OTE4NTU2NX0.BcrXNNc3l9WzAuzGO8EFWe54zBwsOsdHKNje__mbwzw";

let supabaseClient = null;
let initializationAttempted = false;
let initializationPromise = null;

// Lazy initialization with retry logic
async function initializeSupabase() {
  if (supabaseClient) {
    return supabaseClient;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = new Promise((resolve) => {
    try {
      // Double check AsyncStorage is available
      if (typeof AsyncStorage === "undefined" || !AsyncStorage) {
        console.error("AsyncStorage is not available");
        resolve(null);
        return;
      }

      supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
        global: {
          headers: {
            "x-client-info": "rutgers-knightlife",
          },
        },
      });

      resolve(supabaseClient);
    } catch (error) {
      console.error("Failed to initialize Supabase client:", error);
      supabaseClient = null;
      resolve(null);
    } finally {
      initializationAttempted = true;
    }
  });

  return initializationPromise;
}

// Get Supabase client - returns null if not ready
export function getSupabaseClient() {
  if (!initializationAttempted) {
    // Don't initialize synchronously - return null and let caller handle it
    return null;
  }
  return supabaseClient;
}

// Initialize Supabase client asynchronously
export async function initSupabaseClient() {
  return await initializeSupabase();
}

export default getSupabaseClient;
