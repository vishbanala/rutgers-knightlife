import { Link, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

// ---------------------------
// SUPABASE CONFIG (React Native safe)
// ---------------------------
// NO TOP-LEVEL IMPORTS - Everything loaded dynamically

// ---------------------------
// ADMIN CONFIG
// ---------------------------
const ADMIN_PASSWORD = "RUTGERS_SECRET_2025";
const ADMIN_SECRET_KEY = "RUTGERS_ADMIN_2025";

function EventsScreenContent() {
  const [events, setEvents] = useState([]);
  const [adminMode, setAdminMode] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showAdminUI, setShowAdminUI] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Hooks MUST be called unconditionally - can't wrap in try-catch
  const params = useLocalSearchParams();

  const [tapCount, setTapCount] = useState(0);

  const [newEvent, setNewEvent] = useState({
    frat: "",
    date: "",
    time: "",
    details: "",
  });

  // ---------------------------
  // FETCH EVENTS - Defined first with useCallback
  // ---------------------------
  const fetchEvents = useCallback(async () => {
    let refreshingSet = false;
    try {
      try {
        setRefreshing(true);
        refreshingSet = true;
      } catch (e) {
        // Component might be unmounting
        return;
      }
      
      // Dynamically import Supabase functions - NO top-level import
      let supabase = null;
      try {
        const supabaseModule = await import("../lib/supabase");
        const getSupabaseClient = supabaseModule.getSupabaseClient;
        const initSupabaseClient = supabaseModule.initSupabaseClient;
        
        supabase = getSupabaseClient();
        if (!supabase) {
          supabase = await initSupabaseClient();
        }
      } catch (initErr) {
        console.log("Supabase unavailable:", initErr);
        // Continue without Supabase - show empty state
      }
      
      if (!supabase) {
        console.log("No database connection - showing empty state");
        setEvents([]);
        return;
      }

      // Make the query with timeout protection
      let queryResult = null;
      try {
        const queryPromise = supabase
          .from("events")
          .select("*")
          .order("id", { ascending: false });

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Query timeout")), 10000)
        );

        queryResult = await Promise.race([queryPromise, timeoutPromise]).catch(err => {
          console.log("Query failed:", err);
          return { data: null, error: err };
        });
      } catch (queryErr) {
        console.log("Query error:", queryErr);
        queryResult = { data: null, error: queryErr };
      }

      const { data, error } = queryResult || { data: null, error: new Error("No result") };

      if (error) {
        console.log("Fetch error:", error);
        setEvents([]);
        return;
      }
      
      // Ensure data is always an array and filter invalid items
      if (Array.isArray(data)) {
        const validData = data.filter(item => item && typeof item === "object");
        setEvents(validData);
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.log("Unexpected error fetching events:", err);
      setEvents([]);
    } finally {
      if (refreshingSet) {
        try {
          setRefreshing(false);
        } catch (e) {
          // Ignore
        }
      }
    }
  }, []);

  // ---------------------------
  // LOAD EVENTS - Delayed initialization
  // ---------------------------
  useEffect(() => {
    let mounted = true;
    let cancelled = false;
    
    // Set ready immediately - don't wait for Supabase
    setIsReady(true);
    
    // TEMPORARILY DISABLED: Initialize and load data after a longer delay
    // This helps isolate if Supabase is causing the crash
    const initAndLoad = async () => {
      try {
        // Wait MUCH longer to ensure React Native is completely ready
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        if (cancelled || !mounted) return;
        
        // TEMPORARILY DISABLED: Don't initialize Supabase on startup
        // Uncomment this after confirming app doesn't crash without it
        /*
        try {
          const supabaseModule = await import("../lib/supabase");
          const initSupabaseClient = supabaseModule.initSupabaseClient;
          await initSupabaseClient();
        } catch (initErr) {
          console.log("Supabase init failed, continuing without it:", initErr);
        }
        
        if (cancelled || !mounted) return;
        
        // Additional delay before fetching
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (!cancelled && mounted) {
          fetchEvents();
        }
        */
      } catch (err) {
        console.log("Error in initial load:", err);
      }
    };
    
    initAndLoad();
    
    return () => {
      cancelled = true;
      mounted = false;
    };
  }, [fetchEvents]);

  // ---------------------------
  // ADMIN ACCESS CHECK
  // ---------------------------
  useEffect(() => {
    const checkAdminAccess = () => {
      try {
        // Check if __DEV__ is available (might not be in some builds)
        const isDev = typeof __DEV__ !== "undefined" && __DEV__;
        
        if (isDev) {
          setShowAdminUI(true);
          return;
        }

        // Check for router param (safe access)
        try {
          if (params && typeof params === "object" && params.admin_key === ADMIN_SECRET_KEY) {
            setShowAdminUI(true);
            return;
          }
        } catch (e) {
          console.log("Error reading params:", e);
        }

        setShowAdminUI(false);
      } catch (e) {
        console.log("Admin check error:", e);
        const isDev = typeof __DEV__ !== "undefined" && __DEV__;
        setShowAdminUI(isDev);
      }
    };

    if (isReady) {
      checkAdminAccess();
    }
  }, [params, isReady]);

  // ---------------------------
  // SECRET TAP TO UNLOCK ADMIN MODE
  // ---------------------------
  useEffect(() => {
    let timeoutId = null;
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const handleSecretTap = () => {
    try {
      const count = tapCount + 1;
      setTapCount(count);

      // Reset after short delay - store timeout ID for cleanup
      const timeoutId = setTimeout(() => {
        try {
          setTapCount(0);
        } catch (e) {
          // Ignore
        }
      }, 700);

      if (count >= 5) {
        try {
          setAdminMode(true);
          if (typeof alert !== "undefined") {
            alert("Admin Mode Unlocked");
          }
          setTapCount(0);
          clearTimeout(timeoutId);
        } catch (e) {
          console.log("Error in admin unlock:", e);
        }
      }
    } catch (err) {
      console.log("Error in handleSecretTap:", err);
    }
  };

  // ---------------------------
  // ADMIN LOGIN
  // ---------------------------
  const tryLogin = () => {
    try {
      if (passwordInput === ADMIN_PASSWORD) {
        if (typeof alert !== "undefined") {
          alert("Admin access granted");
        }
        setAdminMode(true);
      } else {
        if (typeof alert !== "undefined") {
          alert("Wrong password");
        }
      }
    } catch (err) {
      console.log("Error in tryLogin:", err);
    }
  };

  // ---------------------------
  // CREATE EVENT
  // ---------------------------
  const createEvent = useCallback(async () => {
    try {
      if (!adminMode) {
        if (typeof alert !== "undefined") alert("Unauthorized");
        return;
      }

      let supabase = null;
      try {
        const supabaseModule = await import("../lib/supabase");
        const getSupabaseClient = supabaseModule.getSupabaseClient;
        const initSupabaseClient = supabaseModule.initSupabaseClient;
        
        supabase = getSupabaseClient();
        if (!supabase) {
          supabase = await initSupabaseClient();
        }
      } catch (initErr) {
        console.log("Supabase init error:", initErr);
      }
      
      if (!supabase) {
        if (typeof alert !== "undefined") alert("Database connection error");
        return;
      }

      const { error } = await supabase.from("events").insert([newEvent]);

      if (error) {
        console.log("Create error:", error);
        if (typeof alert !== "undefined") {
          alert("Error creating event: " + (error.message || "Unknown error"));
        }
      } else {
        setNewEvent({ frat: "", date: "", time: "", details: "" });
        fetchEvents();
      }
    } catch (err) {
      console.log("Unexpected error creating event:", err);
      if (typeof alert !== "undefined") alert("Unexpected error occurred");
    }
  }, [adminMode, newEvent, fetchEvents]);

  // ---------------------------
  // DELETE EVENT
  // ---------------------------
  const deleteEvent = useCallback(async (id) => {
    try {
      if (!adminMode) {
        if (typeof alert !== "undefined") alert("Unauthorized");
        return;
      }
      if (!id) {
        if (typeof alert !== "undefined") alert("Invalid event ID");
        return;
      }

      let supabase = null;
      try {
        const supabaseModule = await import("../lib/supabase");
        const getSupabaseClient = supabaseModule.getSupabaseClient;
        const initSupabaseClient = supabaseModule.initSupabaseClient;
        
        supabase = getSupabaseClient();
        if (!supabase) {
          supabase = await initSupabaseClient();
        }
      } catch (initErr) {
        console.log("Supabase init error:", initErr);
      }
      
      if (!supabase) {
        if (typeof alert !== "undefined") alert("Database connection error");
        return;
      }

      const { error } = await supabase.from("events").delete().eq("id", id);

      if (error) {
        console.log("Delete error:", error);
        if (typeof alert !== "undefined") {
          alert("Error deleting event: " + (error.message || "Unknown error"));
        }
      } else {
        fetchEvents();
      }
    } catch (err) {
      console.log("Unexpected error deleting event:", err);
      if (typeof alert !== "undefined") alert("Unexpected error occurred");
    }
  }, [adminMode, fetchEvents]);

  // ---------------------------
  // UI
  // ---------------------------
  // Don't render until ready to prevent crashes
  if (!isReady) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {(() => {
        try {
          return <Stack.Screen options={{ title: "Events" }} />;
        } catch (e) {
          return null;
        }
      })()}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.hiddenTapTitle} onPress={handleSecretTap}>
          Rutgers KnightLife Events
        </Text>
        {(() => {
          try {
            return (
              <Link href="/" asChild>
                <TouchableOpacity style={styles.backButton}>
                  <Text style={styles.backButtonText}>← Home</Text>
                </TouchableOpacity>
              </Link>
            );
          } catch (e) {
            return (
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => {
                  try {
                    // Fallback navigation if Link fails
                    console.log("Link failed, using fallback");
                  } catch (err) {
                    console.log("Navigation error:", err);
                  }
                }}
              >
                <Text style={styles.backButtonText}>← Home</Text>
              </TouchableOpacity>
            );
          }
        })()}
      </View>

      {/* Refresh */}
      <TouchableOpacity 
        style={styles.buttonRed} 
        onPress={() => {
          try {
            fetchEvents();
          } catch (e) {
            console.log("Error refreshing:", e);
          }
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.refreshIcon}>🔄</Text>
        <Text style={styles.buttonText}>Refresh Events</Text>
      </TouchableOpacity>

      {/* Event List */}
      {!Array.isArray(events) || events.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📅</Text>
          <Text style={styles.emptyText}>No events yet</Text>
          <Text style={styles.emptySubtext}>Check back later!</Text>
        </View>
      ) : (
        <FlatList
          data={Array.isArray(events) ? events : []}
          keyExtractor={(item, index) => {
            try {
              if (item && item.id) {
                return String(item.id);
              }
              return `event-${index}`;
            } catch (e) {
              return `event-fallback-${index}`;
            }
          }}
          renderItem={({ item, index }) => {
            try {
              if (!item || typeof item !== "object") return null;
              return (
                <View style={styles.eventCard}>
                  <View style={styles.eventHeader}>
                    <Text style={styles.eventFrat}>🎉 {item.frat || "Unknown"}</Text>

                    {adminMode && item.id && (
                      <TouchableOpacity
                        onPress={() => {
                          try {
                            deleteEvent(item.id);
                          } catch (e) {
                            console.log("Error in delete:", e);
                          }
                        }}
                        style={styles.deleteBtn}
                      >
                        <Text style={styles.deleteText}>🗑️</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.eventTimeRow}>
                    <Text style={styles.eventDateIcon}>📅</Text>
                    <Text style={styles.eventInfo}>
                      {item.date || "TBD"} @ {item.time || "TBD"}
                    </Text>
                  </View>

                  <Text style={styles.eventDetails}>{item.details || "No details provided"}</Text>
                </View>
              );
            } catch (e) {
              console.log("Error rendering item:", e);
              return null;
            }
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchEvents} />
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Admin Login */}
      {!adminMode && showAdminUI && (
        <View style={styles.adminSection}>
          <Text style={styles.sectionTitle}>🔐 Admin Login</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Admin Password"
            placeholderTextColor="#999"
            secureTextEntry
            value={passwordInput}
            onChangeText={setPasswordInput}
          />
          <TouchableOpacity 
            style={styles.buttonBlack} 
            onPress={tryLogin}
          >
            <Text style={styles.buttonText}>Unlock Admin</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Create Event */}
      {adminMode && (
        <View style={styles.adminSection}>
          <Text style={styles.sectionTitle}>✨ Create New Event</Text>

          <TextInput
            style={styles.input}
            placeholder="Frat Name"
            placeholderTextColor="#999"
            value={newEvent.frat}
            onChangeText={(t) => setNewEvent({ ...newEvent, frat: t })}
          />
          <TextInput
            style={styles.input}
            placeholder="Date (e.g., Friday, Jan 15)"
            placeholderTextColor="#999"
            value={newEvent.date}
            onChangeText={(t) => setNewEvent({ ...newEvent, date: t })}
          />
          <TextInput
            style={styles.input}
            placeholder="Time (e.g., 9:00 PM)"
            placeholderTextColor="#999"
            value={newEvent.time}
            onChangeText={(t) => setNewEvent({ ...newEvent, time: t })}
          />
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Event Details"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            value={newEvent.details}
            onChangeText={(t) => setNewEvent({ ...newEvent, details: t })}
          />

          <TouchableOpacity 
            style={styles.buttonBlack} 
            onPress={createEvent}
          >
            <Text style={styles.buttonText}>+ Create Event</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ----------------------
// STYLES
// ----------------------
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#FFFFFF" },

  header: {
    marginBottom: 20,
    alignItems: "center",
  },

  hiddenTapTitle: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
    color: "#CC0033",
    letterSpacing: -0.5,
  },

  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    alignSelf: "flex-start",
  },

  backButtonText: {
    fontSize: 14,
    color: "#CC0033",
    fontWeight: "600",
  },

  buttonRed: {
    backgroundColor: "#CC0033",
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  refreshIcon: { fontSize: 18 },

  buttonBlack: {
    backgroundColor: "#000000",
    padding: 16,
    borderRadius: 14,
    marginTop: 10,
  },

  buttonText: { 
    color: "#FFF", 
    textAlign: "center", 
    fontSize: 17, 
    fontWeight: "700",
  },

  listContent: { paddingBottom: 20 },

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },

  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 20, fontWeight: "700", color: "#333", marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: "#666", textAlign: "center" },

  eventCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },

  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },

  eventFrat: { 
    fontSize: 22, 
    fontWeight: "800", 
    color: "#CC0033",
    flex: 1,
  },

  deleteBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FFF5F5",
  },

  deleteText: { fontSize: 20 },

  eventTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },

  eventDateIcon: { fontSize: 16 },
  eventInfo: { fontSize: 15, color: "#666", fontWeight: "600" },
  eventDetails: { fontSize: 15, color: "#333", lineHeight: 22 },

  adminSection: {
    marginTop: 24,
    padding: 20,
    backgroundColor: "#F9F9F9",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },

  input: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    marginBottom: 12,
    fontSize: 16,
    color: "#333",
  },

  inputMultiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },

  sectionTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 16,
    color: "#CC0033",
  },
});

// Error fallback for this screen
function EventsErrorFallback({ error, resetErrorBoundary }) {
  return (
    <View style={styles.container}>
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>Error loading events</Text>
        <TouchableOpacity 
          style={styles.buttonBlack} 
          onPress={resetErrorBoundary}
        >
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Export with error boundary
export default function EventsScreen() {
  return (
    <ErrorBoundary
      FallbackComponent={EventsErrorFallback}
      onError={(error, errorInfo) => {
        console.error("EventsScreen error:", error, errorInfo);
      }}
    >
      <EventsScreenContent />
    </ErrorBoundary>
  );
}
