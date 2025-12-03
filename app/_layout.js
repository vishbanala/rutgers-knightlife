// CRITICAL: react-native-gesture-handler MUST be imported first
// Must use import (not require) for ES modules
import "react-native-gesture-handler";

import { Stack } from "expo-router";
import { ErrorBoundary } from "react-error-boundary";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Global error handler - wrapped in try-catch to prevent crashes
try {
  if (typeof ErrorUtils !== "undefined") {
    const originalHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      try {
        // Enhanced logging for debugging
        const errorInfo = {
          message: error?.message || "Unknown error",
          stack: error?.stack || "No stack trace",
          isFatal: isFatal,
          name: error?.name || "Error",
          timestamp: new Date().toISOString(),
        };
        
        console.error("=== GLOBAL ERROR ===");
        console.error(JSON.stringify(errorInfo, null, 2));
        console.error("Full error:", error);
        console.error("===================");
        
        // Don't use AsyncStorage in error handler - it may not be initialized yet
        // This was causing the TurboModule crash
        
        // Call original handler to maintain default behavior
        if (originalHandler) {
          originalHandler(error, isFatal);
        }
      } catch (e) {
        console.error("Error in error handler:", e);
      }
    });
  }
} catch (e) {
  console.error("Failed to setup ErrorUtils:", e);
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
  const [isBridgeReady, setIsBridgeReady] = useState(false);

  useEffect(() => {
    // CRITICAL: Wait for React Native bridge to be fully ready
    // TurboModules crash if called before bridge is initialized (crash at ~770ms)
    // We wait 3+ seconds to be absolutely safe
    const waitForBridge = async () => {
      try {
        // Wait 3 seconds minimum - crash happens at 770ms, so this should be safe
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Additional safety: try to verify bridge is ready (but don't crash if it fails)
        try {
          // Use dynamic import to avoid top-level require
          const ReactNative = await import("react-native");
          if (ReactNative && ReactNative.NativeModules) {
            const moduleCount = Object.keys(ReactNative.NativeModules || {}).length;
            if (moduleCount > 10) {
              // Bridge seems ready (has many modules registered)
              setIsBridgeReady(true);
              return;
            }
          }
        } catch (e) {
          // If check fails, that's OK - we'll use the delay-based approach
          console.log("Bridge check failed (this is OK):", e);
        }
        
        // Always set ready after delay - don't hang the app
        setIsBridgeReady(true);
      } catch (e) {
        console.error("Error waiting for bridge:", e);
        // Still set ready to prevent app from hanging
        setIsBridgeReady(true);
      }
    };

    waitForBridge();

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

  // Don't render until bridge is ready to prevent TurboModule crashes
  if (!isBridgeReady) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary 
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        const crashInfo = {
          error: {
            message: error?.message,
            stack: error?.stack,
            name: error?.name,
          },
          errorInfo: errorInfo,
          timestamp: new Date().toISOString(),
        };
        
        console.error("=== ERROR BOUNDARY ===");
        console.error(JSON.stringify(crashInfo, null, 2));
        console.error("Full error:", error);
        console.error("Error info:", errorInfo);
        console.error("======================");
        
        // Don't use AsyncStorage in error handler - it may not be initialized yet
        // This was causing the TurboModule crash
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
