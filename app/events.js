import { Link, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
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
import { getSupabaseClient } from "../lib/supabase";

// ---------------------------
// ADMIN CONFIG
// ---------------------------
const ADMIN_PASSWORD = "RUTGERS_SECRET_2025";
const ADMIN_SECRET_KEY = "RUTGERS_ADMIN_2025";

export default function EventsScreen() {
  const [events, setEvents] = useState([]);
  const [adminMode, setAdminMode] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showAdminUI, setShowAdminUI] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const params = useLocalSearchParams();
  const [tapCount, setTapCount] = useState(0);

  const [newEvent, setNewEvent] = useState({
    frat: "",
    date: "",
    time: "",
    details: "",
  });

  // ---------------------------
  // LOAD EVENTS 
  // ---------------------------
  useEffect(() => {
    // Add small delay to ensure React Native is fully initialized
    const timer = setTimeout(() => {
      fetchEvents();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const fetchEvents = async () => {
    try {
      setRefreshing(true);
      const supabase = getSupabaseClient();
      
      if (!supabase) {
        setEvents([]);
        return;
      }

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("id", { ascending: false });

      if (error) {
        console.log("Fetch error:", error);
        setEvents([]); // Set empty array on error to prevent crashes
        return;
      }
      
      // Ensure data is always an array and has valid structure
      if (Array.isArray(data)) {
        setEvents(data);
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.log("Unexpected error fetching events:", err);
      setEvents([]); // Set empty array on error
    } finally {
      setRefreshing(false);
    }
  };

  // ---------------------------
  // ADMIN ACCESS CHECK
  // ---------------------------
  useEffect(() => {
    const checkAdminAccess = () => {
      try {
        // Always show in dev (Expo Go)
        if (__DEV__) {
          setShowAdminUI(true);
          return;
        }

        // Check for router param
        if (params?.admin_key === ADMIN_SECRET_KEY) {
          setShowAdminUI(true);
          return;
        }


        setShowAdminUI(false);
      } catch (e) {
        console.log("Admin check error:", e);
        setShowAdminUI(__DEV__);
      }
    };

    checkAdminAccess();
  }, [params]);

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

      // Reset after short delay
      const timeoutId = setTimeout(() => setTapCount(0), 700);

      if (count >= 5) {
        setAdminMode(true);
        if (typeof alert !== "undefined") {
          alert("Admin Mode Unlocked");
        }
        setTapCount(0);
        clearTimeout(timeoutId);
      }
    } catch (err) {
      console.log("Error in handleSecretTap:", err);
    }
  };

  // ---------------------------
  // ADMIN LOGIN
  // ---------------------------
  const tryLogin = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      alert("Admin access granted");
      setAdminMode(true);
    } else {
      alert("Wrong password");
    }
  };

  // ---------------------------
  // CREATE EVENT
  // ---------------------------
  const createEvent = async () => {
    try {
      if (!adminMode) {
        if (typeof alert !== "undefined") alert("Unauthorized");
        return;
      }

      const supabase = getSupabaseClient();
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
  };

  // ---------------------------
  // DELETE EVENT
  // ---------------------------
  const deleteEvent = async (id) => {
    try {
      if (!adminMode) {
        if (typeof alert !== "undefined") alert("Unauthorized");
        return;
      }
      if (!id) {
        if (typeof alert !== "undefined") alert("Invalid event ID");
        return;
      }

      const supabase = getSupabaseClient();
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
  };

  // ---------------------------
  // UI
  // ---------------------------
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Events" }} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.hiddenTapTitle} onPress={handleSecretTap}>
          Rutgers KnightLife Events
        </Text>
        <Link href="/" asChild>
          <TouchableOpacity style={styles.backButton}>
            <Text style={styles.backButtonText}>← Home</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {/* Refresh */}
      <TouchableOpacity 
        style={styles.buttonRed} 
        onPress={fetchEvents}
        activeOpacity={0.8}
      >
        <Text style={styles.refreshIcon}>🔄</Text>
        <Text style={styles.buttonText}>Refresh Events</Text>
      </TouchableOpacity>

      {/* Event List */}
      {events.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📅</Text>
          <Text style={styles.emptyText}>No events yet</Text>
          <Text style={styles.emptySubtext}>Check back later!</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => (item?.id || Math.random()).toString()}
          renderItem={({ item }) => {
            if (!item) return null;
            return (
              <View style={styles.eventCard}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventFrat}>🎉 {item.frat || "Unknown"}</Text>

                  {adminMode && item.id && (
                    <TouchableOpacity
                      onPress={() => deleteEvent(item.id)}
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
