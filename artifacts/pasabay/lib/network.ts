import { useEffect, useState } from "react";
import { Platform } from "react-native";

interface NetworkState {
  isOnline: boolean;
  lastChecked: Date;
}

let _isOnline = true;

/**
 * Synchronous network status check. Returns the last known state.
 */
export function isOnline(): boolean {
  return _isOnline;
}

/**
 * Hook that detects network connectivity changes.
 * Uses browser online/offline events on web, and periodic fetch pings on native.
 */
export function useNetworkStatus(): NetworkState {
  const [state, setState] = useState<NetworkState>({
    isOnline: true,
    lastChecked: new Date(),
  });

  useEffect(() => {
    if (Platform.OS === "web") {
      // Web: use navigator.onLine + events
      const updateOnline = () => {
        _isOnline = navigator.onLine;
        setState({ isOnline: navigator.onLine, lastChecked: new Date() });
      };

      window.addEventListener("online", updateOnline);
      window.addEventListener("offline", updateOnline);

      // Initial state
      _isOnline = navigator.onLine;
      setState({ isOnline: navigator.onLine, lastChecked: new Date() });

      return () => {
        window.removeEventListener("online", updateOnline);
        window.removeEventListener("offline", updateOnline);
      };
    } else {
      // Native: periodic fetch ping every 10 seconds
      let cancelled = false;

      const checkConnection = async () => {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);
          const res = await fetch("https://www.google.com/generate_204", {
            method: "HEAD",
            signal: controller.signal,
          });
          clearTimeout(timeout);
          if (!cancelled) {
            _isOnline = res.ok || res.status === 204;
            setState({ isOnline: _isOnline, lastChecked: new Date() });
          }
        } catch {
          if (!cancelled) {
            _isOnline = false;
            setState({ isOnline: false, lastChecked: new Date() });
          }
        }
      };

      checkConnection();
      const interval = setInterval(checkConnection, 10000);

      return () => {
        cancelled = true;
        clearInterval(interval);
      };
    }
  }, []);

  return state;
}
