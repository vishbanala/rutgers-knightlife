import { Link } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function SearchScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🔍</Text>
        <Text style={styles.title}>Search Frats</Text>
        <Text style={styles.subtitle}>Coming Soon</Text>
        <Text style={styles.description}>
          We're working on an amazing search feature to help you find fraternity events and information.
        </Text>
      </View>

      <Link href="/" asChild>
        <TouchableOpacity style={styles.homeButton} activeOpacity={0.8}>
          <Text style={styles.homeButtonText}>← Back to Home</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 20,
  },

  content: {
    alignItems: "center",
    marginBottom: 40,
    maxWidth: 320,
  },

  emoji: {
    fontSize: 72,
    marginBottom: 20,
  },

  title: { 
    fontSize: 32, 
    fontWeight: "800", 
    color: "#CC0033",
    marginBottom: 8,
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#666",
    marginBottom: 16,
  },

  description: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },

  homeButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },

  homeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#CC0033",
  },
});
