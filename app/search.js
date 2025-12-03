// ---------------------------
// SUPABASE CONFIG (React Native safe)
// ---------------------------
// NO TOP-LEVEL IMPORTS - Everything loaded dynamically
import { Link, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ---------------------------
// ADMIN CONFIG
// ---------------------------
const ADMIN_PASSWORD = "RUTGERS_SECRET_2025";
const ADMIN_SECRET_KEY = "RUTGERS_ADMIN_2025";

function SearchScreenContent() {
  const [frats, setFrats] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [adminMode, setAdminMode] = useState(false);
  const [showAdminUI, setShowAdminUI] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [newFrat, setNewFrat] = useState({
    name: "",
    abbreviation: "",
    address: "",
    details: "",
  });

  // Hooks MUST be called unconditionally - can't wrap in try-catch
  const params = useLocalSearchParams();

  // ---------------------------
  // FETCH FRATS - Defined first with useCallback
  // ---------------------------
  const fetchFrats = useCallback(async () => {
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
        setFrats([]);
        return;
      }

      // Make the query with timeout protection
      let queryResult = null;
      try {
        const queryPromise = supabase
          .from("frats")
          .select("*")
          .order("name");

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
        console.log("Fetch frats error:", error);
        setFrats([]);
        return;
      }
      
      // Ensure data is always an array and filter invalid items
      if (Array.isArray(data)) {
        const validData = data.filter(item => item && typeof item === "object");
        setFrats(validData);
      } else {
        setFrats([]);
      }
    } catch (err) {
      console.log("Unexpected error fetching frats:", err);
      setFrats([]);
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
  // LOAD FRATS - Delayed initialization
  // ---------------------------
  useEffect(() => {
    let mounted = true;
    let cancelled = false;
    
    // Set ready immediately - don't wait for Supabase
    setIsReady(true);
    
    // Initialize and load data after a longer delay
    const initAndLoad = async () => {
      try {
        // Wait longer to ensure React Native is completely ready
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        if (cancelled || !mounted) return;
        
        // Initialize Supabase client (may fail, that's OK)
        try {
          const supabaseModule = await import("../lib/supabase");
          const initSupabaseClient = supabaseModule.initSupabaseClient;
          await initSupabaseClient();
        } catch (initErr) {
          console.log("Supabase init failed, continuing without it:", initErr);
        }
        
        if (cancelled || !mounted) return;
        
        // Additional delay before fetching
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (!cancelled && mounted) {
          fetchFrats();
        }
      } catch (err) {
        console.log("Error in initial load:", err);
      }
    };
    
    initAndLoad();
    
    return () => {
      cancelled = true;
      mounted = false;
    };
  }, [fetchFrats]);

  const toggleExpanded = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const tryLogin = () => {
    try {
      if (passwordInput === ADMIN_PASSWORD) {
        setAdminMode(true);
        if (typeof alert !== "undefined") alert("Admin access granted");
      } else {
        if (typeof alert !== "undefined") alert("Wrong password");
      }
    } catch (err) {
      console.log("Error in tryLogin:", err);
    }
  };

  const createFrat = useCallback(async () => {
    try {
      if (!adminMode) {
        if (typeof alert !== "undefined") alert("Unauthorized");
        return;
      }
      if (!newFrat.name || !newFrat.abbreviation || !newFrat.address) {
        if (typeof alert !== "undefined") alert("Please fill out name, abbreviation, and address");
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

      const { error } = await supabase.from("frats").insert([newFrat]);

      if (error) {
        console.log("Create frat error:", error);
        if (typeof alert !== "undefined") {
          alert("Error adding frat: " + (error.message || "Unknown error"));
        }
      } else {
        setNewFrat({ name: "", abbreviation: "", address: "", details: "" });
        fetchFrats();
      }
    } catch (err) {
      console.log("Unexpected error creating frat:", err);
      if (typeof alert !== "undefined") alert("Unexpected error occurred");
    }
  }, [adminMode, newFrat, fetchFrats]);

  const deleteFrat = useCallback(async (id) => {
    try {
      if (!adminMode) {
        if (typeof alert !== "undefined") alert("Unauthorized");
        return;
      }
      if (!id) {
        if (typeof alert !== "undefined") alert("Invalid frat ID");
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

      const { error } = await supabase.from("frats").delete().eq("id", id);

      if (error) {
        console.log("Delete frat error:", error);
        if (typeof alert !== "undefined") {
          alert("Error deleting frat: " + (error.message || "Unknown error"));
        }
      } else {
        fetchFrats();
      }
    } catch (err) {
      console.log("Unexpected error deleting frat:", err);
      if (typeof alert !== "undefined") alert("Unexpected error occurred");
    }
  }, [adminMode, fetchFrats]);

  const renderFratCard = useCallback(({ item }) => {
    try {
      if (!item || typeof item !== "object" || !item.id) return null;
      const isExpanded = expandedId === item.id;
      return (
        <TouchableOpacity
          style={styles.fratCard}
          activeOpacity={0.9}
          onPress={() => {
            try {
              toggleExpanded(item.id);
            } catch (e) {
              console.log("Error toggling:", e);
            }
          }}
        >
          <View style={styles.fratHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fratName}>{item.name || "Unknown"}</Text>
              <Text style={styles.fratAbbrev}>Known as {item.abbreviation || "N/A"}</Text>
            </View>
            <Text style={styles.chevron}>{isExpanded ? "▲" : "▼"}</Text>
          </View>

          <View style={styles.addressRow}>
            <Text style={styles.addressIcon}>📍</Text>
            <Text style={styles.addressText}>{item.address || "Address not provided"}</Text>
          </View>

          {isExpanded && (
            <>
              {item.details ? (
                <Text style={styles.fratDetails}>{item.details}</Text>
              ) : (
                <Text style={styles.fratDetailsMuted}>
                  No extra details provided yet
                </Text>
              )}

              {adminMode && item.id && (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => {
                    try {
                      deleteFrat(item.id);
                    } catch (e) {
                      console.log("Error deleting:", e);
                    }
                  }}
                >
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </TouchableOpacity>
      );
    } catch (e) {
      console.log("Error rendering frat card:", e);
      return null;
    }
  }, [expandedId, adminMode, deleteFrat]);

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
          return <Stack.Screen options={{ title: "Search Frats" }} />;
        } catch (e) {
          return null;
        }
      })()}

      <Text style={styles.pageTitle}>Rutgers Fraternity Directory</Text>
      <Text style={styles.pageSubtitle}>
        Tap a frat to see their address and details
      </Text>

      {!Array.isArray(frats) || frats.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🏡</Text>
          <Text style={styles.emptyTitle}>No frats added yet</Text>
          <Text style={styles.emptySubtitle}>
            Admins can add frats from the console below.
          </Text>
        </View>
      ) : (
        <FlatList
          data={Array.isArray(frats) ? frats : []}
          keyExtractor={(item, index) => {
            try {
              if (item && item.id) {
                return String(item.id);
              }
              return `frat-${index}`;
            } catch (e) {
              return `frat-fallback-${index}`;
            }
          }}
          renderItem={renderFratCard}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={() => {
                try {
                  fetchFrats();
                } catch (e) {
                  console.log("Error refreshing:", e);
                }
              }} 
            />
          }
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}

      {!adminMode && showAdminUI && (
        <View style={styles.adminSection}>
          <Text style={styles.sectionTitle}>Admin Login</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Admin Password"
            placeholderTextColor="#999"
            secureTextEntry
            value={passwordInput}
            onChangeText={setPasswordInput}
          />
          <TouchableOpacity style={styles.buttonBlack} onPress={tryLogin}>
            <Text style={styles.buttonText}>Unlock Admin Tools</Text>
          </TouchableOpacity>
        </View>
      )}

      {adminMode && (
        <View style={styles.adminSection}>
          <Text style={styles.sectionTitle}>Add New Frat</Text>

          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#999"
            value={newFrat.name}
            onChangeText={(t) => setNewFrat({ ...newFrat, name: t })}
          />
          <TextInput
            style={styles.input}
            placeholder="Abbreviation / Nickname"
            placeholderTextColor="#999"
            value={newFrat.abbreviation}
            onChangeText={(t) => setNewFrat({ ...newFrat, abbreviation: t })}
          />
          <TextInput
            style={styles.input}
            placeholder="Address"
            placeholderTextColor="#999"
            value={newFrat.address}
            onChangeText={(t) => setNewFrat({ ...newFrat, address: t })}
          />
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Extra details (optional)"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            value={newFrat.details}
            onChangeText={(t) => setNewFrat({ ...newFrat, details: t })}
          />

          <TouchableOpacity style={styles.buttonRed} onPress={createFrat}>
            <Text style={styles.buttonText}>+ Add Frat</Text>
          </TouchableOpacity>
        </View>
      )}

      {(() => {
        try {
          return (
            <Link href="/" asChild>
              <TouchableOpacity style={styles.homeButton}>
                <Text style={styles.homeButtonText}>← Back to Home</Text>
              </TouchableOpacity>
            </Link>
          );
        } catch (e) {
          return (
            <TouchableOpacity 
              style={styles.homeButton}
              onPress={() => {
                try {
                  console.log("Link failed, using fallback");
                } catch (err) {
                  console.log("Navigation error:", err);
                }
              }}
            >
              <Text style={styles.homeButtonText}>← Back to Home</Text>
            </TouchableOpacity>
          );
        }
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#CC0033",
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 15,
    color: "#666",
    marginTop: 4,
    marginBottom: 20,
  },
  fratCard: {
    backgroundColor: "#FFF",
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  fratHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  fratName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111",
  },
  fratAbbrev: {
    fontSize: 14,
    color: "#CC0033",
    fontWeight: "600",
    marginTop: 4,
  },
  chevron: {
    fontSize: 18,
    color: "#999",
    marginLeft: 12,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  addressIcon: {
    fontSize: 18,
  },
  addressText: {
    fontSize: 15,
    color: "#333",
    flex: 1,
  },
  fratDetails: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
    marginTop: 4,
  },
  fratDetailsMuted: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
  },
  deleteBtn: {
    marginTop: 12,
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#FFE6E6",
  },
  deleteText: {
    color: "#CC0033",
    fontWeight: "700",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
  },
  adminSection: {
    marginTop: 24,
    padding: 18,
    backgroundColor: "#F9F9F9",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#CC0033",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  buttonRed: {
    backgroundColor: "#CC0033",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 6,
  },
  buttonBlack: {
    backgroundColor: "#000",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 6,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
  homeButton: {
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    alignItems: "center",
    marginTop: 20,
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#CC0033",
  },
});

// Error fallback for this screen
function SearchErrorFallback({ error, resetErrorBoundary }) {
  return (
    <View style={styles.container}>
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Error loading frats</Text>
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
export default function SearchScreen() {
  return (
    <ErrorBoundary
      FallbackComponent={SearchErrorFallback}
      onError={(error, errorInfo) => {
        console.error("SearchScreen error:", error, errorInfo);
      }}
    >
      <SearchScreenContent />
    </ErrorBoundary>
  );
}
