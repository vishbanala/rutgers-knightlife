import { Link, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// ---- SUPABASE CONFIG ----
const SUPABASE_URL = "https://dlplpqxixmzupgtbwqen.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscGxwcXhpeG16dXBndGJ3cWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MDk1NjUsImV4cCI6MjA3OTE4NTU2NX0.BcrXNNc3l9WzAuzGO8EFWe54zBwsOsdHKNje__mbwzw";

// ---- SIMPLE ADMIN LOGIN ----
// Only YOU know this password
const ADMIN_PASSWORD = "RUTGERS_SECRET_2025";

import { createClient } from "@supabase/supabase-js";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function EventsScreen() {
  const [events, setEvents] = useState([]);
  const [admin, setAdmin] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

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
  // FETCH EVENTS (Public)
  // ------------------------
  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("id", { ascending: false });

    if (error) console.log("Fetch error:", error);
    else setEvents(data);
  };

  // ------------------------
  // ADMIN LOGIN
  // ------------------------
  const tryLogin = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setAdmin(true);
      alert("Admin mode activated");
    } else {
      alert("Incorrect password");
    }
  };

  // ------------------------
  // CREATE EVENT (Admin)
  // ------------------------
  const createEvent = async () => {
    if (!admin) return alert("Not authorized");

    const { error } = await supabase.from("events").insert([newEvent]);

    if (error) console.log("Create error:", error);
    else {
      setNewEvent({ frat: "", date: "", time: "", details: "" });
      fetchEvents();
    }
  };

  // ------------------------
  // DELETE EVENT (Admin)
  // ------------------------
  const deleteEvent = async (id) => {
    if (!admin) return alert("Not authorized");

    const { error } = await supabase.from("events").delete().eq("id", id);

    if (error) console.log("Delete error:", error);
    else fetchEvents();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Events" }} />

      {/* Back to Home */}
      <Link href="/" style={styles.backLink}>← Back to Home</Link>

      {/* Always show events */}
      <TouchableOpacity style={styles.buttonRed} onPress={fetchEvents}>
        <Text style={styles.buttonText}>Refresh Events</Text>
      </TouchableOpacity>

      {/* EVENT LIST */}
      <FlatList
        data={events}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={({ item }) => (
          <View style={styles.eventCard}>
            <Text style={styles.eventFrat}>{item.frat}</Text>
            <Text style={styles.eventInfo}>{item.date} @ {item.time}</Text>
            <Text style={styles.eventDetails}>{item.details}</Text>

            {admin && (
              <TouchableOpacity
                onPress={() => deleteEvent(item.id)}
                style={styles.deleteBtn}
              >
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      {/* ADMIN LOGIN SECTION */}
      {!admin && (
        <>
          <Text style={styles.sectionTitle}>Admin Login</Text>
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={passwordInput}
            onChangeText={setPasswordInput}
          />
          <TouchableOpacity style={styles.buttonBlack} onPress={tryLogin}>
            <Text style={styles.buttonText}>Enter Admin Mode</Text>
          </TouchableOpacity>
        </>
      )}

      {/* CREATE EVENT (ADMIN ONLY) */}
      {admin && (
        <>
          <Text style={styles.sectionTitle}>Create Event</Text>

          <TextInput
            style={styles.input}
            placeholder="Frat"
            value={newEvent.frat}
            onChangeText={(t) => setNewEvent({ ...newEvent, frat: t })}
          />
          <TextInput
            style={styles.input}
            placeholder="Date"
            value={newEvent.date}
            onChangeText={(t) => setNewEvent({ ...newEvent, date: t })}
          />
          <TextInput
            style={styles.input}
            placeholder="Time"
            value={newEvent.time}
            onChangeText={(t) => setNewEvent({ ...newEvent, time: t })}
          />
          <TextInput
            style={styles.input}
            placeholder="Details"
            value={newEvent.details}
            onChangeText={(t) => setNewEvent({ ...newEvent, details: t })}
          />

          <TouchableOpacity style={styles.buttonBlack} onPress={createEvent}>
            <Text style={styles.buttonText}>Create Event</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

//
// ----------------------
// STYLES
// ----------------------
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F5F5F5" },

  backLink: { fontSize: 18, color: "#CC0033", fontWeight: "bold", marginBottom: 15 },

  buttonRed: {
    backgroundColor: "#CC0033",
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
  },
  buttonBlack: {
    backgroundColor: "#000",
    padding: 14,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: { color: "#FFF", textAlign: "center", fontSize: 18, fontWeight: "bold" },

  eventCard: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 6,
    borderLeftColor: "#CC0033",
    marginBottom: 14,
    position: "relative",
  },

  deleteBtn: {
    position: "absolute",
    right: 12,
    top: 10,
    padding: 6,
  },

  deleteText: { color: "red", fontWeight: "bold", fontSize: 16 },

  eventFrat: { fontSize: 20, fontWeight: "bold", color: "#CC0033" },
  eventInfo: { color: "#333" },
  eventDetails: { color: "#555", marginTop: 6 },

  input: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DDD",
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginVertical: 10,
    color: "#CC0033",
  },
});
