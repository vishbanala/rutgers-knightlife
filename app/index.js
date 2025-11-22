import { Link } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Home() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>⚡</Text>
        <Text style={styles.title}>Rutgers</Text>
        <Text style={styles.subtitle}>KnightLife</Text>
        <Text style={styles.tagline}>Your Night, Your Way</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Link href="/events" asChild>
          <TouchableOpacity style={styles.buttonRed} activeOpacity={0.8}>
            <Text style={styles.buttonEmoji}>🎉</Text>
            <Text style={styles.buttonText}>View Events</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/search" asChild>
          <TouchableOpacity style={styles.buttonBlack} activeOpacity={0.8}>
            <Text style={styles.buttonEmoji}>🔍</Text>
            <Text style={styles.buttonText}>Search Frats</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 60,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 10,
  },
  title: {
    fontSize: 42,
    fontWeight: "800",
    color: "#CC0033",
    letterSpacing: -1,
    marginBottom: -5,
  },
  subtitle: {
    fontSize: 36,
    fontWeight: "700",
    color: "#000000",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: "#666666",
    fontWeight: "500",
    marginTop: 5,
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 320,
    gap: 16,
  },
  buttonRed: {
    backgroundColor: "#CC0033",
    padding: 20,
    borderRadius: 16,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#CC0033",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonBlack: {
    backgroundColor: "#000000",
    padding: 20,
    borderRadius: 16,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonEmoji: {
    fontSize: 24,
  },
  buttonText: {
    color: "#FFF",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
