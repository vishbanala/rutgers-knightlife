import { Link, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Platform, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// ---- SUPABASE CONFIG ----
const SUPABASE_URL = "https://dlplpqxixmzupgtbwqen.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscGxwcXhpeG16dXBndGJ3cWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MDk1NjUsImV4cCI6MjA3OTE4NTU2NX0.BcrXNNc3l9WzAuzGO8EFWe54zBwsOsdHKNje__mbwzw";

// ---- SECRET ADMIN PASSWORD ----
const ADMIN_PASSWORD = "RUTGERS_SECRET_2025";
// ---- SECRET KEY TO SHOW ADMIN UI (add ?admin_key=YOUR_SECRET_KEY to URL) ----
const ADMIN_SECRET_KEY = "RUTGERS_ADMIN_2025";

import { createClient } from "@supabase/supabase-js";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function EventsScreen() {
  const [events, setEvents] = useState([]);
  const [adminMode, setAdminMode] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showAdminUI, setShowAdminUI] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Get URL search params from Expo Router
  const params = useLocalSearchParams();

  // hidden tap counter
  const [tapCount, setTapCount] = useState(0);

  const [newEvent, setNewEvent] = useState({
    frat: "",
    date: "",
    time: "",
    details: "",
  });

  // LOAD EVENTS ON START
  useEffect(() => {
    fetchEvents();
  }, []);

  // ------------------------
  // CHECK IF ADMIN UI SHOULD BE SHOWN
  // In development (Expo): Always show admin UI
  // In production (deployed): Only show if secret key is in URL
  // ------------------------
  useEffect(() => {
    const checkAdminAccess = () => {
      try {
        // In development mode (Expo local), always show admin UI
        if (__DEV__) {
          setShowAdminUI(true);
          return;
        }

        // In production, check for secret key in URL
        // Check Expo Router params first (works for web and mobile)
        const adminKey = params?.admin_key;
        if (adminKey === ADMIN_SECRET_KEY) {
          setShowAdminUI(true);
          return;
        }

        // Fallback: Check window.location for web (in case params don't work)
        if (Platform.OS === "web" && typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          const urlAdminKey = urlParams.get("admin_key");
          if (urlAdminKey === ADMIN_SECRET_KEY) {
            setShowAdminUI(true);
            return;
          }
        }

        // If no valid key found in production, hide admin UI
        setShowAdminUI(false);
      } catch (error) {
        console.log("Error checking admin access:", error);
        // In dev mode, show anyway; in production, hide
        setShowAdminUI(__DEV__);
      }
    };

    checkAdminAccess();
  }, [params]);

  // ------------------------
  // FETCH EVENTS (Public)
  // ------------------------
  const fetchEvents = async () => {
    setRefreshing(true);
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("id", { ascending: false });

    if (error) console.log("Fetch error:", error);
    else setEvents(data);
    setRefreshing(false);
  };

  // --------------------------------------
  // SECRET TAP TO UNLOCK ADMIN MODE
  // --------------------------------------
  const handleSecretTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);

    setTimeout(() => setTapCount(0), 700); // reset taps after 0.7s

    if (newCount >= 5) {
      setAdminMode(true);
      alert("Admin Mode Unlocked");
      setTapCount(0);
    }
  };

  // ------------------------
  // ADMIN LOGIN
  // ------------------------
  const tryLogin = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      alert("Admin access granted");
      setAdminMode(true);
    } else {
      alert("Wrong password");
    }
  };

  // ------------------------
  // CREATE EVENT
  // ------------------------
  const createEvent = async () => {
    if (!adminMode) return alert("Unauthorized");

    const { error } = await supabase.from("events").insert([newEvent]);

    if (error) console.log("Create error:", error);
    else {
      setNewEvent({ frat: "", date: "", time: "", details: "" });
      fetchEvents();
    }
  };

  // ------------------------
  // DELETE EVENT
  // ------------------------
  const deleteEvent = async (id) => {
    if (!adminMode) return alert("Unauthorized");

    const { error } = await supabase.from("events").delete().eq("id", id);

    if (error) console.log("Delete error:", error);
    else fetchEvents();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Events" }} />

      {/* Header */}
      <View style={styles.header}>
        <Text
          style={styles.hiddenTapTitle}
          onPress={handleSecretTap}
        >
          Rutgers KnightLife Events
        </Text>
        <Link href="/" asChild>
          <TouchableOpacity style={styles.backButton}>
            <Text style={styles.backButtonText}>← Home</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {/* Refresh Events */}
      <TouchableOpacity 
        style={styles.buttonRed} 
        onPress={fetchEvents}
        activeOpacity={0.8}
      >
        <Text style={styles.refreshIcon}>🔄</Text>
        <Text style={styles.buttonText}>Refresh Events</Text>
      </TouchableOpacity>

      {/* EVENT LIST */}
      {events.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📅</Text>
          <Text style={styles.emptyText}>No events yet</Text>
          <Text style={styles.emptySubtext}>Check back later for upcoming events!</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={({ item }) => (
            <View style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <Text style={styles.eventFrat}>🎉 {item.frat}</Text>
                {adminMode && (
                  <TouchableOpacity
                    onPress={() => deleteEvent(item.id)}
                    style={styles.deleteBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.deleteText}>🗑️</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.eventTimeRow}>
                <Text style={styles.eventDateIcon}>📅</Text>
                <Text style={styles.eventInfo}>{item.date} @ {item.time}</Text>
              </View>
              <Text style={styles.eventDetails}>{item.details}</Text>
            </View>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchEvents} />
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* ADMIN LOGIN (only visible if adminMode has NOT been unlocked yet AND showAdminUI is true) */}
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
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Unlock Admin</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* CREATE EVENT (only visible in admin mode) */}
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
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>+ Create Event</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

//
// ----------------------
// STYLES
// ----------------------
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: "#FFFFFF" 
  },

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
    shadowColor: "#CC0033",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },

  refreshIcon: {
    fontSize: 18,
  },

  buttonBlack: {
    backgroundColor: "#000000",
    padding: 16,
    borderRadius: 14,
    marginTop: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },

  buttonText: { 
    color: "#FFF", 
    textAlign: "center", 
    fontSize: 17, 
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  listContent: {
    paddingBottom: 20,
  },

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },

  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },

  emptyText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },

  emptySubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },

  eventCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
    letterSpacing: -0.3,
  },

  deleteBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FFF5F5",
  },

  deleteText: { 
    fontSize: 20,
  },

  eventTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },

  eventDateIcon: {
    fontSize: 16,
  },

  eventInfo: { 
    fontSize: 15,
    color: "#666",
    fontWeight: "600",
  },

  eventDetails: { 
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
  },

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
    paddingTop: 16,
  },

  sectionTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 16,
    color: "#CC0033",
    letterSpacing: -0.5,
  },
});
