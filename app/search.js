import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function SearchScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search Frats Coming Soon</Text>

      {/* 🔥 Back to Home */}
      <Link href="/" style={styles.homeLink}>
        <Text style={styles.homeLinkText}>← Back to Home</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    padding: 20
  },

  title: { 
    fontSize: 24, 
    fontWeight: "600", 
    color: "#CC0033",
    marginBottom: 40
  },

  homeLink: {
    marginTop: 20,
  },

  homeLinkText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#CC0033",
  },
});
