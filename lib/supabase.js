// Safe Supabase client initialization for React Native
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const SUPABASE_URL = "https://dlplpqxixmzupgtbwqen.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscGxwcXhpeG16dXBndGJ3cWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MDk1NjUsImV4cCI6MjA3OTE4NTU2NX0.BcrXNNc3l9WzAuzGO8EFWe54zBwsOsdHKNje__mbwzw";

let supabaseClient = null;

// Lazy initialization to prevent crashes on app startup
export function getSupabaseClient() {
  if (!supabaseClient) {
    try {
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
      // Return a mock client that won't crash
      return {
        from: () => ({
          select: () => ({ data: null, error: { message: "Client not initialized" } }),
          insert: () => ({ error: { message: "Client not initialized" } }),
          delete: () => ({ eq: () => ({ error: { message: "Client not initialized" } }) }),
        }),
      };
    }
  }
  return supabaseClient;
}

export default getSupabaseClient;

