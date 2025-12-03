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

// Lazy initialization to prevent crashes on app startup
export function getSupabaseClient() {
  // Only attempt initialization once
  if (!initializationAttempted) {
    initializationAttempted = true;
    
    try {
      // Check if AsyncStorage is available
      if (!AsyncStorage) {
        console.error("AsyncStorage is not available");
        return null;
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
    } catch (error) {
      console.error("Failed to initialize Supabase client:", error);
      supabaseClient = null;
    }
  }
  
  // Return null if initialization failed - let callers handle it
  return supabaseClient;
}

export default getSupabaseClient;
