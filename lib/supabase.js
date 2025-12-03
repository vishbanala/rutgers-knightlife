// Ultra-safe Supabase client initialization
// This file does NOT import anything at the top level to prevent crashes

let supabaseClient = null;
let initializationAttempted = false;
let initializationPromise = null;

// Completely lazy initialization - only when called
async function initializeSupabase() {
  if (supabaseClient) {
    return supabaseClient;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      // Import everything dynamically and in the right order
      // Load polyfill FIRST
      await import("react-native-url-polyfill/auto");
      
      // Small delay to ensure polyfill is loaded
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Then import AsyncStorage
      const AsyncStorageModule = await import("@react-native-async-storage/async-storage");
      const AsyncStorage = AsyncStorageModule.default;
      
      if (!AsyncStorage) {
        console.error("AsyncStorage not available");
        return null;
      }

      // Then import Supabase
      const { createClient } = await import("@supabase/supabase-js");

      const SUPABASE_URL = "https://dlplpqxixmzupgtbwqen.supabase.co";
      const SUPABASE_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscGxwcXhpeG16dXBndGJ3cWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MDk1NjUsImV4cCI6MjA3OTE4NTU2NX0.BcrXNNc3l9WzAuzGO8EFWe54zBwsOsdHKNje__mbwzw";

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

      return supabaseClient;
    } catch (error) {
      console.error("Failed to initialize Supabase:", error);
      supabaseClient = null;
      return null;
    } finally {
      initializationAttempted = true;
    }
  })();

  return initializationPromise;
}

// Get Supabase client - returns null if not ready
export function getSupabaseClient() {
  try {
    return supabaseClient;
  } catch (e) {
    console.log("Error getting Supabase client:", e);
    return null;
  }
}

// Initialize Supabase client asynchronously
export async function initSupabaseClient() {
  try {
    if (!initializationAttempted) {
      return await initializeSupabase();
    }
    return supabaseClient;
  } catch (e) {
    console.log("Error initializing Supabase client:", e);
    return null;
  }
}

// Safe default export
export default function safeGetSupabaseClient() {
  try {
    return getSupabaseClient();
  } catch (e) {
    console.log("Error in default export:", e);
    return null;
  }
}
