import { Stack } from "expo-router";
import { ErrorBoundary } from "react-error-boundary";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Error fallback component
function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorText}>{error?.message || "Unknown error"}</Text>
      <TouchableOpacity style={styles.errorButton} onPress={resetErrorBoundary}>
        <Text style={styles.errorButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#CC0033",
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  errorButton: {
    padding: 12,
    borderWidth: 2,
    borderColor: "#CC0033",
    borderRadius: 8,
    marginTop: 10,
  },
  errorButtonText: {
    fontSize: 16,
    color: "#CC0033",
    fontWeight: "700",
    textAlign: "center",
  },
});
