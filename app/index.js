import { Link } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rutgers KnightLife</Text>

      <Link href="/events" asChild>
        <TouchableOpacity style={styles.buttonRed}>
          <Text style={styles.buttonText}>View Events</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/search" asChild>
        <TouchableOpacity style={styles.buttonBlack}>
          <Text style={styles.buttonText}>Search Frats</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#CC0033",
    marginBottom: 60,
  },
  buttonRed: {
    backgroundColor: "#CC0033",
    padding: 16,
    borderRadius: 12,
    width: "80%",
    marginBottom: 20,
  },
  buttonBlack: {
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 12,
    width: "80%",
  },
  buttonText: {
    color: "#FFF",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
  },
});
