// CRITICAL: react-native-gesture-handler MUST be imported first
import "react-native-gesture-handler";

import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // MINIMAL APPROACH: Wait 5 full seconds before rendering anything
    // This ensures React Native bridge is 100% ready
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Show absolutely nothing until ready - no native modules called
  if (!isReady) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading...</Text>
      </View>
    );
  }

  // Only render Stack after delay - simplest possible
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  text: {
    fontSize: 18,
    color: "#666",
  },
});
