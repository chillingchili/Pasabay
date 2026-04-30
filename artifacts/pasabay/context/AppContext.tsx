import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import type { GoogleUserInfo } from "@/hooks/useGoogleAuth";
import { apiRequest, clearTokens, setTokens, getTokens, API_BASE, type ApiError } from "@/lib/api";
import {
  connectSocket, disconnectSocket, reconnectSocket,
  onMatchRequest, onMatchConfirmed, onMatchDeclined,
  onRideCompleted, onRideCanceled,
  onMatchAccepted, onDriverLocationUpdate,
  type MatchRequestPayload, type MatchConfirmedPayload, type RideCompletedPayload,
} from "@/lib/socket";
import { useNetworkStatus } from "@/lib/network";

export type UserRole = "passenger" | "driver";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  rating: number;
  totalRides: number;
  verified: boolean;
  driverVerified: boolean;
  driverStatus?: string;
  googleId?: string;
  avatar?: string;
  vehicle?: {
    make: string;
    model: string;
    year: string;
    plate: string;
    color: string;
    seats: number;
    fuelEfficiency: number;
  };
  fuelEfficiencyEstimate?: number;
}

export interface RideHistory {
  id: string;
  route: string;
  from: string;
  to: string;
  date: string;
  fare: number;
  status: "completed" | "canceled";
  withName?: string;
  cancelReason?: string;
}

export interface ActiveRide {
  rideId: string;
  driver: {
    id: string;
    name: string;
    rating: number;
    avatar?: string;
    vehicle?: { make: string; model: string; color: string; plate: string; fuelEfficiency?: number } | null;
  };
  pickup: { lat: number; lng: number; name: string };
  dropoff: { lat: number; lng: number; name: string };
  fare: number;
  matchingFee: number;
  total: number;
  distanceKm: number;
}

interface AppContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  rideHistory: RideHistory[];
  activeRole: UserRole;
  socketConnected: boolean;
  networkStatus: "online" | "offline" | "reconnecting";
  pendingMatchRequest: MatchRequestPayload | null;
  matchConfirmed: MatchConfirmedPayload | null;
  completedRide: RideCompletedPayload | null;
  activeRide: ActiveRide | null;
  driverLocation: { lat: number; lng: number; heading?: number } | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (googleUser: GoogleUserInfo) => Promise<{ isNew: boolean }>;
  logout: () => void;
  signup: (name: string, email: string, password: string) => Promise<void>;
  setSchoolIdVerified: () => void;
  setDriverVerified: (vehicle: UserProfile["vehicle"]) => void;
  switchRole: (role: UserRole) => void;
  loginAsDemo: () => Promise<void>;
  addRideHistory: (ride: RideHistory) => void;
  refreshUser: () => Promise<void>;
  clearPendingMatch: () => void;
  clearMatchConfirmed: () => void;
  clearCompletedRide: () => void;
  clearActiveRide: () => void;
  setActiveRide: (ride: ActiveRide | null) => void;
  forceLogout: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function mapApiUser(data: any): UserProfile {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.activeRole ?? data.role ?? "passenger",
    rating: data.rating ?? 5.0,
    totalRides: data.totalRides ?? 0,
    verified: data.schoolIdStatus === "verified",
    driverVerified: data.driverStatus === "verified",
    driverStatus: data.driverStatus ?? undefined,
    googleId: data.googleId ?? undefined,
    avatar: data.avatar ?? undefined,
    vehicle: data.vehicle ?? undefined,
    fuelEfficiencyEstimate: data.fuelEfficiencyEstimate ?? undefined,
  };
}

function mapApiRide(r: any): RideHistory {
  const d = new Date(r.createdAt);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let dateStr: string;
  if (d.toDateString() === today.toDateString()) {
    dateStr = `Today, ${d.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })}`;
  } else if (d.toDateString() === yesterday.toDateString()) {
    dateStr = `Yesterday, ${d.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })}`;
  } else {
    dateStr = `${d.toLocaleDateString("en-PH", { month: "short", day: "numeric" })}, ${d.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })}`;
  }

  return {
    id: r.id,
    route: `${r.fromName} → ${r.toName}`,
    from: r.fromName,
    to: r.toName,
    date: dateStr,
    fare: (r.fare ?? 0) + (r.matchingFee ?? 0),
    status: r.status === "completed" ? "completed" : "canceled",
    withName: r.driverName ?? undefined,
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rideHistory, setRideHistory] = useState<RideHistory[]>([]);
  const [activeRole, setActiveRole] = useState<UserRole>("passenger");
  const [socketConnected, setSocketConnected] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<"online" | "offline" | "reconnecting">("online");
  const [pendingMatchRequest, setPendingMatchRequest] = useState<MatchRequestPayload | null>(null);
  const [matchConfirmed, setMatchConfirmed] = useState<MatchConfirmedPayload | null>(null);
  const [completedRide, setCompletedRide] = useState<RideCompletedPayload | null>(null);
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number; heading?: number } | null>(null);

  const setUserState = (profile: UserProfile) => {
    setUser(profile);
    setActiveRole(profile.role);
  };

  const initSocket = useCallback(async () => {
    try {
      await connectSocket();
      setSocketConnected(true);

      const offMatchRequest = onMatchRequest((data) => {
        setPendingMatchRequest(data);
      });
      const offMatchConfirmed = onMatchConfirmed((data) => {
        setMatchConfirmed(data);
        setActiveRide({
          rideId: data.rideId,
          driver: {
            id: data.driver.id,
            name: data.driver.name,
            rating: data.driver.rating,
            avatar: data.driver.avatar ?? undefined,
            vehicle: data.driver.vehicle
              ? { make: data.driver.vehicle.make, model: data.driver.vehicle.model, color: data.driver.vehicle.color, plate: data.driver.vehicle.plate }
              : null,
          },
          pickup: data.pickup,
          dropoff: data.dropoff,
          fare: data.fare,
          matchingFee: data.matchingFee,
          total: data.total,
          distanceKm: data.distanceKm,
        });
      });
      const offMatchDeclined = onMatchDeclined(() => {
        setMatchConfirmed(null);
        setActiveRide(null);
        setDriverLocation(null);
      });
      const offRideCompleted = onRideCompleted((data) => {
        setCompletedRide(data);
      });
      const offRideCanceled = onRideCanceled(() => {
        setMatchConfirmed(null);
        setActiveRide(null);
        setDriverLocation(null);
      });
      const offMatchAccepted = onMatchAccepted(() => {
        // Driver side: rideId will be set by driver-home.tsx listening directly.
        // This listener exists for completeness but driver tracks rideId locally.
      });
      const offDriverLocation = onDriverLocationUpdate((data) => {
        setDriverLocation({ lat: data.lat, lng: data.lng, heading: data.heading });
      });

      return () => {
        offMatchRequest();
        offMatchConfirmed();
        offMatchDeclined();
        offRideCompleted();
        offRideCanceled();
        offMatchAccepted();
        offDriverLocation();
      };
    } catch {
      setSocketConnected(false);
      return () => {};
    }
  }, []);

  // Monitor network status and handle socket reconnection
  const network = useNetworkStatus();
  const prevOnlineRef = useRef(true);

  useEffect(() => {
    const currentlyOnline = network.isOnline;
    const wasOnline = prevOnlineRef.current;
    prevOnlineRef.current = currentlyOnline;

    if (!currentlyOnline) {
      setSocketConnected(false);
      setNetworkStatus("offline");
    } else if (currentlyOnline && !wasOnline) {
      // Just came back online — reconnect socket
      setNetworkStatus("reconnecting");
      reconnectSocket()
        .then(() => {
          setSocketConnected(true);
          setNetworkStatus("online");
        })
        .catch(() => {
          setSocketConnected(false);
          setNetworkStatus("online"); // network is back even if socket fails
        });
    }
  }, [network.isOnline]);

  const forceLogoutRef = useRef<() => Promise<void>>(async () => {});

  const refreshUser = useCallback(async () => {
    try {
      const data = await apiRequest<any>("/users/profile");
      const profile = mapApiUser(data);
      setUserState(profile);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr?.status === 401) {
        await forceLogoutRef.current();
      }
    }
  }, []);

  const loadRideHistory = useCallback(async () => {
    try {
      const data = await apiRequest<any>("/rides/history?limit=20");
      const rides = Array.isArray(data?.rides) ? data.rides.map(mapApiRide) : [];
      setRideHistory(rides);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr?.status === 401) {
        await forceLogoutRef.current();
      } else {
        setRideHistory([]);
      }
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const { refresh } = await getTokens();
        if (!refresh) return;

        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: refresh }),
        });

        if (!res.ok) {
          await clearTokens();
          return;
        }

        const { accessToken, refreshToken, user: apiUser } = await res.json() as any;
        await setTokens(accessToken, refreshToken);
        const profile = mapApiUser(apiUser);
        setUserState(profile);
        // Restore driver verification state from AsyncStorage
        try {
          const stored = await AsyncStorage.getItem("pasabay_driver_verified");
          if (stored) {
            const parsed = JSON.parse(stored);
            setUser(prev => prev ? {
              ...prev,
              driverVerified: parsed.driverVerified ?? prev.driverVerified,
              driverStatus: parsed.driverStatus ?? prev.driverStatus,
              vehicle: parsed.vehicle ?? prev.vehicle,
              fuelEfficiencyEstimate: parsed.fuelEfficiencyEstimate ?? prev.fuelEfficiencyEstimate,
            } : null);
          }
        } catch {
          // ignore stale data
        }
        // Restore school ID verification state from AsyncStorage
        try {
          const stored = await AsyncStorage.getItem("pasabay_school_id_verified");
          if (stored) {
            const parsed = JSON.parse(stored);
            setUser(prev => prev ? {
              ...prev,
              verified: parsed.verified ?? prev.verified,
            } : null);
          }
        } catch {
          // ignore stale data
        }
        loadRideHistory();
        initSocket();
      } catch {
        // session expired or network error — try restoring demo mode
        try {
          const demo = await AsyncStorage.getItem("pasabay_demo_mode");
          if (demo === "true") {
            const demoUser: UserProfile = {
              id: "demo-user-001",
              name: "Maria Santos",
              email: "maria.santos@usc.edu.ph",
              role: "passenger",
              rating: 4.8,
              totalRides: 12,
              verified: true,
              driverVerified: true,
              driverStatus: "verified",
              vehicle: {
                make: "Toyota",
                model: "Vios",
                year: "2022",
                plate: "ABC 1234",
                color: "White",
                seats: 4,
                fuelEfficiency: 18,
              },
            };
            setUserState(demoUser);
            loadRideHistory();
            initSocket();
            return;
          }
        } catch { /* ignore */ }
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const data = await apiRequest<any>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    await setTokens(data.accessToken, data.refreshToken);
    const profile = mapApiUser(data.user);
    setUserState(profile);
    initSocket();
  }, [initSocket]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiRequest<any>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    await setTokens(data.accessToken, data.refreshToken);
    const profile = mapApiUser(data.user);
    setUserState(profile);
    loadRideHistory();
    initSocket();
  }, [loadRideHistory, initSocket]);

  const loginWithGoogle = useCallback(async (googleUser: GoogleUserInfo): Promise<{ isNew: boolean }> => {
    const data = await apiRequest<any>("/auth/google", {
      method: "POST",
      body: JSON.stringify({
        googleId: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
        avatar: googleUser.picture,
      }),
    });
    await setTokens(data.accessToken, data.refreshToken);
    const profile = mapApiUser(data.user);
    setUserState(profile);
    loadRideHistory();
    initSocket();
    return { isNew: data.isNew ?? false };
  }, [loadRideHistory, initSocket]);

  const forceLogout = useCallback(async () => {
    disconnectSocket();
    setSocketConnected(false);
    await clearTokens();
    await AsyncStorage.removeItem("pasabay_driver_verified");
    await AsyncStorage.removeItem("pasabay_school_id_verified");
    await AsyncStorage.removeItem("pasabay_demo_mode");
    setUser(null);
    setActiveRole("passenger");
    setRideHistory([]);
    setPendingMatchRequest(null);
    setMatchConfirmed(null);
    setCompletedRide(null);
    setActiveRide(null);
    setDriverLocation(null);
    router.replace("/welcome");
  }, []);

  forceLogoutRef.current = forceLogout;

  const logout = useCallback(async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      await forceLogout();
    }
  }, [forceLogout]);

  const setSchoolIdVerified = useCallback(async () => {
    if (!user) return;
    try {
      await apiRequest("/users/school-id", {
        method: "POST",
        body: JSON.stringify({ status: "submitted" }),
      });
    } catch {
      // ignore
    }
    setUser({ ...user, verified: true });
    await AsyncStorage.setItem("pasabay_school_id_verified", JSON.stringify({ verified: true }));
  }, [user]);

  const setDriverVerified = useCallback(async (vehicle: UserProfile["vehicle"]) => {
    if (!user) return;
    const response = await apiRequest<any>("/users/driver", {
      method: "POST",
      body: JSON.stringify({
        plate: vehicle?.plate,
        make: vehicle?.make,
        model: vehicle?.model,
        year: parseInt(vehicle?.year ?? "2020"),
        color: vehicle?.color,
        seats: vehicle?.seats ?? 4,
        fuelEfficiency: vehicle?.fuelEfficiency ?? 20,
      }),
    });
    const updated: UserProfile = {
      ...user,
      driverVerified: true,
      driverStatus: response.driverStatus ?? "submitted",
      role: "driver",
      vehicle: response.vehicle ?? vehicle,
      fuelEfficiencyEstimate: response.fuelEfficiencyEstimate ?? undefined,
    };
    setUser(updated);
    setActiveRole("driver");
    await AsyncStorage.setItem("pasabay_driver_verified", JSON.stringify({
      driverVerified: true,
      driverStatus: updated.driverStatus,
      vehicle: updated.vehicle,
      fuelEfficiencyEstimate: updated.fuelEfficiencyEstimate,
    }));
    return response;
  }, [user]);

  const loginAsDemo = useCallback(async () => {
    try {
      const data = await apiRequest<any>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "testuser@usc.edu.ph", password: "testuser1" }),
      });
      await setTokens(data.accessToken, data.refreshToken);
      const profile = mapApiUser(data.user);
      setUserState(profile);
      await AsyncStorage.setItem("pasabay_demo_mode", "true");
      await AsyncStorage.setItem("pasabay_school_id_verified", JSON.stringify({ verified: true }));
      await AsyncStorage.setItem("pasabay_driver_verified", JSON.stringify({
        driverVerified: true,
        driverStatus: "verified",
        vehicle: profile.vehicle,
      }));
      loadRideHistory();
      initSocket();
    } catch {
      const signupData = await apiRequest<any>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email: "testuser@usc.edu.ph", password: "testuser1", name: "Test User" }),
      });
      await setTokens(signupData.accessToken, signupData.refreshToken);
      const profile = mapApiUser(signupData.user);
      setUserState(profile);
      await AsyncStorage.setItem("pasabay_demo_mode", "true");
      await AsyncStorage.setItem("pasabay_school_id_verified", JSON.stringify({ verified: true }));
      await AsyncStorage.setItem("pasabay_driver_verified", JSON.stringify({
        driverVerified: true,
        driverStatus: "verified",
        vehicle: profile.vehicle,
      }));
      loadRideHistory();
      initSocket();
    }
  }, [loadRideHistory, initSocket]);

  const switchRole = useCallback(async (role: UserRole) => {
    setActiveRole(role);
    if (user) {
      try {
        await apiRequest("/users/switch-role", {
          method: "POST",
          body: JSON.stringify({ role }),
        });
      } catch {
        // ignore
      }
    }
  }, [user]);

  const addRideHistory = useCallback((ride: RideHistory) => {
    setRideHistory(prev => [ride, ...prev]);
  }, []);

  return (
    <AppContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      rideHistory,
      activeRole,
      socketConnected,
      networkStatus,
      pendingMatchRequest,
      matchConfirmed,
      completedRide,
      activeRide,
      driverLocation,
      login,
      loginWithGoogle,
      logout,
      signup,
      setSchoolIdVerified,
      setDriverVerified,
      switchRole,
      loginAsDemo,
      addRideHistory,
      refreshUser,
      clearPendingMatch: () => setPendingMatchRequest(null),
      clearMatchConfirmed: () => setMatchConfirmed(null),
      clearCompletedRide: () => setCompletedRide(null),
      clearActiveRide: () => { setActiveRide(null); setDriverLocation(null); },
      setActiveRide: (ride) => setActiveRide(ride),
      forceLogout,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
