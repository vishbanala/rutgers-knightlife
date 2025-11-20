import { Link, Stack } from "expo-router";
import { useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const BACKEND_URL = "http://10.75.248.15:8081/api/events";
const ADMIN_KEY = "RUTGERS_SECRET_2025";  // MUST MATCH BACKEND

export default function EventsScreen() {
  const [events, setEvents] = useState([]);
  const [adminMode, setAdminMode] = useState(false); // ⬅ NEW
  const [tempKey, setTempKey] = useState(""); // ⬅ NEW

  const [newEvent, setNewEvent] = useState({
    frat: "",
    date: "",
    time: "",
    details: "",
  });

  // GET events
  const fetchEvents = async () => {
    try {
      const res = await fetch(BACKEND_URL);
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error(err);
    }
  };

  // POST event (admin only)
  const createEvent = async () => {
    try {
      await fetch(BACKEND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": ADMIN_KEY,
        },
        body: JSON.stringify(newEvent),
      });

      setNewEvent({ frat: "", date: "", time: "", details: "" });
      fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  // DELETE event (admin only)
  const deleteEvent = async (id) => {
    try {
      await fetch(`${BACKEND_URL}/${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-key": ADMIN_KEY,
        },
      });

      fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  /* 🔐 ADMIN LOGIN — unlock admin mode */
  const tryLogin = () => {
    if (tempKey === ADMIN_KEY) {
      setAdminMode(true);
    } else {
      alert("Wrong admin key");
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Events" }} />

      {/* Back to Home */}
      <Link href="/" style={styles.backLink}>
        ← Back to Home
      </Link>

      {/* Load events */}
      <TouchableOpacity style={styles.buttonRed} onPress={fetchEvents}>
        <Text style={styles.buttonText}>Load Events</Text>
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

            {/* DELETE ONLY IN ADMIN MODE */}
            {adminMode && (
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

      {/* 🔐 ADMIN LOGIN SECTION (only visible when NOT logged in) */}
      {!adminMode && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.sectionTitle}>Admin Login</Text>
          <TextInput
            style={styles.input}
            secureTextEntry={true}
            placeholder="Enter admin key"
            value={tempKey}
            onChangeText={setTempKey}
          />
          <TouchableOpacity style={styles.buttonBlack} onPress={tryLogin}>
            <Text style={styles.buttonText}>Unlock Admin</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* CREATE EVENTS — visible ONLY if adminMode === true */}
      {adminMode && (
        <>
          <Text style={styles.sectionTitle}>Create Event</Text>

          <TextInput style={styles.input} placeholder="Frat" value={newEvent.frat} onChangeText={(t) => setNewEvent({ ...newEvent, frat: t })}/>
          <TextInput style={styles.input} placeholder="Date" value={newEvent.date} onChangeText={(t) => setNewEvent({ ...newEvent, date: t })}/>
          <TextInput style={styles.input} placeholder="Time" value={newEvent.time} onChangeText={(t) => setNewEvent({ ...newEvent, time: t })}/>
          <TextInput style={styles.input} placeholder="Details" value={newEvent.details} onChangeText={(t) => setNewEvent({ ...newEvent, details: t })}/>

          <TouchableOpacity style={styles.buttonBlack} onPress={createEvent}>
            <Text style={styles.buttonText}>Create Event</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

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
