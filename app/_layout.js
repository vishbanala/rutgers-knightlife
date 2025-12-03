import { Stack } from "expo-router";
import { ErrorBoundary } from "react-error-boundary";
import { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Global error handler - wrapped in try-catch to prevent crashes
try {
  if (typeof ErrorUtils !== "undefined") {
    const originalHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      try {
        console.error("Global error:", error, "isFatal:", isFatal);
        // Call original handler to maintain default behavior
        if (originalHandler) {
          originalHandler(error, isFatal);
        }
      } catch (e) {
        // Ignore errors in error handler
      }
    });
  }
} catch (e) {
  // Ignore if ErrorUtils setup fails
}

// Error fallback component
function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorText}>
        {error?.message || error?.toString() || "Unknown error"}
      </Text>
      <TouchableOpacity 
        style={styles.errorButton} 
        onPress={() => {
          try {
            resetErrorBoundary();
          } catch (e) {
            console.log("Error resetting:", e);
          }
        }}
      >
        <Text style={styles.errorButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function RootLayout() {
  useEffect(() => {
    // Catch any unhandled promise rejections (web only)
    try {
      if (typeof window !== "undefined" && window.addEventListener) {
        const rejectionHandler = (event) => {
          console.error("Unhandled promise rejection:", event.reason);
          if (event && typeof event.preventDefault === "function") {
            event.preventDefault();
          }
        };
        
        window.addEventListener("unhandledrejection", rejectionHandler);
        
        return () => {
          if (typeof window !== "undefined" && window.removeEventListener) {
            window.removeEventListener("unhandledrejection", rejectionHandler);
          }
        };
      }
    } catch (e) {
      console.log("Error setting up rejection handler:", e);
    }
  }, []);

  return (
    <ErrorBoundary 
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error("ErrorBoundary caught error:", error, errorInfo);
      }}
    >
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
