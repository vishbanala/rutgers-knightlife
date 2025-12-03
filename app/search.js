// ---------------------------
// SUPABASE CONFIG (React Native safe)
// ---------------------------
import { getSupabaseClient, initSupabaseClient } from "../lib/supabase";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
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

export default function SearchScreen() {
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

  let params = null;
  try {
    params = useLocalSearchParams();
  } catch (e) {
    console.log("Error getting params:", e);
  }

  useEffect(() => {
    let mounted = true;
    
    // Initialize Supabase first, then load data
    const initAndLoad = async () => {
      try {
        // Wait longer to ensure React Native is fully ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (!mounted) return;
        
        // Initialize Supabase client
        await initSupabaseClient();
        
        if (!mounted) return;
        
        setIsReady(true);
        
        // Small delay before fetching
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (mounted) {
          fetchFrats();
        }
      } catch (err) {
        console.log("Error in initial load:", err);
        if (mounted) {
          setIsReady(true);
        }
      }
    };
    
    initAndLoad();
    
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const checkAdminAccess = () => {
      try {
        // Check if __DEV__ is available (might not be in some builds)
        const isDev = typeof __DEV__ !== "undefined" && __DEV__;
        
        if (isDev) {
          setShowAdminUI(true);
          return;
        }

        // In production, check for secret key in URL
        if (params && params.admin_key === ADMIN_SECRET_KEY) {
          setShowAdminUI(true);
          return;
        }

        // If no valid key found in production, hide admin UI
        setShowAdminUI(false);
      } catch (error) {
        console.log("Error checking admin access:", error);
        const isDev = typeof __DEV__ !== "undefined" && __DEV__;
        setShowAdminUI(isDev);
      }
    };

    if (isReady) {
      checkAdminAccess();
    }
  }, [params, isReady]);

  const fetchFrats = async () => {
    try {
      setRefreshing(true);
      
      // Ensure Supabase is initialized
      let supabase = getSupabaseClient();
      if (!supabase) {
        try {
          supabase = await initSupabaseClient();
        } catch (initErr) {
          console.log("Error initializing Supabase:", initErr);
          setFrats([]);
          return;
        }
      }
      
      if (!supabase) {
        console.log("Supabase client not available");
        setFrats([]);
        return;
      }

      const { data, error } = await supabase
        .from("frats")
        .select("*")
        .order("name");

      if (error) {
        console.log("Fetch frats error:", error);
        setFrats([]);
        return;
      }
      
      // Ensure data is always an array and has valid structure
      if (Array.isArray(data)) {
        setFrats(data);
      } else {
        setFrats([]);
      }
    } catch (err) {
      console.log("Unexpected error fetching frats:", err);
      setFrats([]);
    } finally {
      try {
        setRefreshing(false);
      } catch (e) {
        // Ignore errors setting refreshing state
      }
    }
  };

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

  const createFrat = async () => {
    try {
      if (!adminMode) {
        if (typeof alert !== "undefined") alert("Unauthorized");
        return;
      }
      if (!newFrat.name || !newFrat.abbreviation || !newFrat.address) {
        if (typeof alert !== "undefined") alert("Please fill out name, abbreviation, and address");
        return;
      }

      let supabase = getSupabaseClient();
      if (!supabase) {
        supabase = await initSupabaseClient();
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
  };

  const deleteFrat = async (id) => {
    try {
      if (!adminMode) {
        if (typeof alert !== "undefined") alert("Unauthorized");
        return;
      }
      if (!id) {
        if (typeof alert !== "undefined") alert("Invalid frat ID");
        return;
      }

      let supabase = getSupabaseClient();
      if (!supabase) {
        supabase = await initSupabaseClient();
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
  };

  const renderFratCard = ({ item }) => {
    if (!item || !item.id) return null;
    const isExpanded = expandedId === item.id;
    return (
      <TouchableOpacity
        style={styles.fratCard}
        activeOpacity={0.9}
        onPress={() => toggleExpanded(item.id)}
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
                onPress={() => deleteFrat(item.id)}
              >
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </TouchableOpacity>
    );
  };

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

      {frats.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🏡</Text>
          <Text style={styles.emptyTitle}>No frats added yet</Text>
          <Text style={styles.emptySubtitle}>
            Admins can add frats from the console below.
          </Text>
        </View>
      ) : (
        <FlatList
          data={frats}
          keyExtractor={(item) => (item?.id || Math.random()).toString()}
          renderItem={renderFratCard}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchFrats} />
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

      <Link href="/" asChild>
        <TouchableOpacity style={styles.homeButton}>
          <Text style={styles.homeButtonText}>← Back to Home</Text>
        </TouchableOpacity>
      </Link>
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
