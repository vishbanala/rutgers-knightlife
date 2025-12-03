import { Link, useLocalSearchParams } from "expo-router";
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

const ADMIN_PASSWORD = "RUTGERS_SECRET_2025";
const ADMIN_SECRET_KEY = "RUTGERS_ADMIN_2025";

export default function SearchScreen() {
  const [frats, setFrats] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [adminMode, setAdminMode] = useState(false);
  const [showAdminUI, setShowAdminUI] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [newFrat, setNewFrat] = useState({
    name: "",
    abbreviation: "",
    address: "",
    details: "",
  });

  const params = useLocalSearchParams();

  const fetchFrats = useCallback(async () => {
    try {
      setRefreshing(true);

      const supabaseModule = await import("../lib/supabase");
      let supabase = supabaseModule.getSupabaseClient();
      if (!supabase) {
        supabase = await supabaseModule.initSupabaseClient();
      }

      if (!supabase) {
        setFrats([]);
        return;
      }

      const { data, error } = await supabase
        .from("frats")
        .select("*")
        .order("name");

      if (error) {
        console.log("Fetch error:", error);
        setFrats([]);
        return;
      }

      if (Array.isArray(data)) {
        setFrats(data.filter(item => item && typeof item === "object"));
      } else {
        setFrats([]);
      }
    } catch (err) {
      console.log("Error fetching frats:", err);
      setFrats([]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const isDev = typeof __DEV__ !== "undefined" && __DEV__;
    if (isDev) {
      setShowAdminUI(true);
    } else if (params?.admin_key === ADMIN_SECRET_KEY) {
      setShowAdminUI(true);
    }

    const timer = setTimeout(() => {
      fetchFrats();
    }, 1000);

    return () => clearTimeout(timer);
  }, [params, fetchFrats]);

  const tryLogin = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setAdminMode(true);
      if (typeof alert !== "undefined") alert("Admin access granted");
    } else {
      if (typeof alert !== "undefined") alert("Wrong password");
    }
  };

  const createFrat = useCallback(async () => {
    if (!adminMode) return;
    if (!newFrat.name || !newFrat.abbreviation || !newFrat.address) {
      if (typeof alert !== "undefined") alert("Please fill out name, abbreviation, and address");
      return;
    }

    try {
      const supabaseModule = await import("../lib/supabase");
      let supabase = supabaseModule.getSupabaseClient();
      if (!supabase) {
        supabase = await supabaseModule.initSupabaseClient();
      }

      if (!supabase) {
        if (typeof alert !== "undefined") alert("Database connection error");
        return;
      }

      const { error } = await supabase.from("frats").insert([newFrat]);

      if (error) {
        if (typeof alert !== "undefined") {
          alert("Error: " + (error.message || "Unknown error"));
        }
      } else {
        setNewFrat({ name: "", abbreviation: "", address: "", details: "" });
        fetchFrats();
      }
    } catch (err) {
      console.log("Error creating frat:", err);
      if (typeof alert !== "undefined") alert("Error occurred");
    }
  }, [adminMode, newFrat, fetchFrats]);

  const deleteFrat = useCallback(async (id) => {
    if (!adminMode || !id) return;

    try {
      const supabaseModule = await import("../lib/supabase");
      let supabase = supabaseModule.getSupabaseClient();
      if (!supabase) {
        supabase = await supabaseModule.initSupabaseClient();
      }

      if (!supabase) {
        if (typeof alert !== "undefined") alert("Database connection error");
        return;
      }

      const { error } = await supabase.from("frats").delete().eq("id", id);

      if (!error) {
        fetchFrats();
      }
    } catch (err) {
      console.log("Error deleting frat:", err);
    }
  }, [adminMode, fetchFrats]);

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Rutgers Fraternity Directory</Text>
      <Text style={styles.pageSubtitle}>Tap a frat to see their address and details</Text>

      {frats.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🏡</Text>
          <Text style={styles.emptyTitle}>No frats added yet</Text>
        </View>
      ) : (
        <FlatList
          data={frats}
          keyExtractor={(item, index) => String(item?.id || index)}
          renderItem={({ item }) => {
            const isExpanded = expandedId === item.id;
            return (
              <TouchableOpacity
                style={styles.fratCard}
                activeOpacity={0.9}
                onPress={() => setExpandedId(isExpanded ? null : item.id)}
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
                      <Text style={styles.fratDetailsMuted}>No extra details provided yet</Text>
                    )}

                    {adminMode && item.id && (
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteFrat(item.id)}>
                        <Text style={styles.deleteText}>Delete</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </TouchableOpacity>
            );
          }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchFrats} />}
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
  addressIcon: { fontSize: 18 },
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
