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

export default function EventsScreen() {
  const [events, setEvents] = useState([]);
  const [adminMode, setAdminMode] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showAdminUI, setShowAdminUI] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newEvent, setNewEvent] = useState({
    frat: "",
    date: "",
    time: "",
    details: "",
  });

  const params = useLocalSearchParams();

  const fetchEvents = useCallback(async () => {
    try {
      setRefreshing(true);
      
      // Dynamically import Supabase
      let supabase = null;
      try {
        const supabaseModule = await import("../lib/supabase");
        supabase = supabaseModule.getSupabaseClient();
        if (!supabase) {
          supabase = await supabaseModule.initSupabaseClient();
        }
      } catch (err) {
        console.log("Supabase unavailable:", err);
        setEvents([]);
        return;
      }

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
        setEvents([]);
        return;
      }

      if (Array.isArray(data)) {
        setEvents(data.filter(item => item && typeof item === "object"));
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.log("Error fetching events:", err);
      setEvents([]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Check admin access
    const isDev = typeof __DEV__ !== "undefined" && __DEV__;
    if (isDev) {
      setShowAdminUI(true);
    } else if (params?.admin_key === ADMIN_SECRET_KEY) {
      setShowAdminUI(true);
    }

    // Load events after a delay
    const timer = setTimeout(() => {
      fetchEvents();
    }, 1000);

    return () => clearTimeout(timer);
  }, [params, fetchEvents]);

  const tryLogin = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setAdminMode(true);
      if (typeof alert !== "undefined") {
        alert("Admin access granted");
      }
    } else {
      if (typeof alert !== "undefined") {
        alert("Wrong password");
      }
    }
  };

  const createEvent = useCallback(async () => {
    if (!adminMode) return;

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

      const { error } = await supabase.from("events").insert([newEvent]);

      if (error) {
        if (typeof alert !== "undefined") {
          alert("Error: " + (error.message || "Unknown error"));
        }
      } else {
        setNewEvent({ frat: "", date: "", time: "", details: "" });
        fetchEvents();
      }
    } catch (err) {
      console.log("Error creating event:", err);
      if (typeof alert !== "undefined") alert("Error occurred");
    }
  }, [adminMode, newEvent, fetchEvents]);

  const deleteEvent = useCallback(async (id) => {
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

      const { error } = await supabase.from("events").delete().eq("id", id);

      if (!error) {
        fetchEvents();
      }
    } catch (err) {
      console.log("Error deleting event:", err);
    }
  }, [adminMode, fetchEvents]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rutgers KnightLife Events</Text>
        <Link href="/" asChild>
          <TouchableOpacity style={styles.backButton}>
            <Text style={styles.backButtonText}>← Home</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <TouchableOpacity style={styles.buttonRed} onPress={fetchEvents} activeOpacity={0.8}>
        <Text style={styles.refreshIcon}>🔄</Text>
        <Text style={styles.buttonText}>Refresh Events</Text>
      </TouchableOpacity>

      {events.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📅</Text>
          <Text style={styles.emptyText}>No events yet</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item, index) => String(item?.id || index)}
          renderItem={({ item }) => (
            <View style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <Text style={styles.eventFrat}>🎉 {item.frat || "Unknown"}</Text>
                {adminMode && item.id && (
                  <TouchableOpacity onPress={() => deleteEvent(item.id)} style={styles.deleteBtn}>
                    <Text style={styles.deleteText}>🗑️</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.eventInfo}>
                📅 {item.date || "TBD"} @ {item.time || "TBD"}
              </Text>
              <Text style={styles.eventDetails}>{item.details || "No details provided"}</Text>
            </View>
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchEvents} />}
          contentContainerStyle={styles.listContent}
        />
      )}

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
          <TouchableOpacity style={styles.buttonBlack} onPress={tryLogin}>
            <Text style={styles.buttonText}>Unlock Admin</Text>
          </TouchableOpacity>
        </View>
      )}

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
          <TouchableOpacity style={styles.buttonBlack} onPress={createEvent}>
            <Text style={styles.buttonText}>+ Create Event</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#FFFFFF" },
  header: { marginBottom: 20, alignItems: "center" },
  title: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
    color: "#CC0033",
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
  eventInfo: { fontSize: 15, color: "#666", fontWeight: "600", marginBottom: 12 },
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
