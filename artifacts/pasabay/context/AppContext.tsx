import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

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
  vehicle?: {
    make: string;
    model: string;
    year: string;
    plate: string;
    color: string;
    seats: number;
    fuelEfficiency: number;
  };
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

interface AppContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  rideHistory: RideHistory[];
  activeRole: UserRole;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (email: string, password: string) => Promise<void>;
  setSchoolIdVerified: () => void;
  setDriverVerified: (vehicle: UserProfile["vehicle"]) => void;
  switchRole: (role: UserRole) => void;
  addRideHistory: (ride: RideHistory) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const MOCK_HISTORY: RideHistory[] = [
  { id: "1", route: "USC Main → IT Park, Lahug", from: "USC Main", to: "IT Park, Lahug", date: "Today, 8:30 AM", fare: 18, status: "completed", withName: "Renz V." },
  { id: "2", route: "USC Gate → SM City Cebu", from: "USC Gate", to: "SM City Cebu", date: "Yesterday, 5:15 PM", fare: 24, status: "completed", withName: "Ana M." },
  { id: "3", route: "USC Main → Ayala Center", from: "USC Main", to: "Ayala Center", date: "Yesterday, 12:40 PM", fare: 0, status: "canceled", cancelReason: "No match" },
  { id: "4", route: "IT Park → USC Talamban", from: "IT Park", to: "USC Talamban", date: "Apr 10, 4:00 PM", fare: 22, status: "completed", withName: "Mark L." },
  { id: "5", route: "USC Main → JY Square", from: "USC Main", to: "JY Square", date: "Apr 9, 7:45 AM", fare: 15, status: "completed", withName: "Carlo S." },
  { id: "6", route: "Banilad → USC Talamban", from: "Banilad", to: "USC Talamban", date: "Apr 8, 6:30 PM", fare: 12, status: "completed", withName: "Lisa T." },
  { id: "7", route: "USC Gate → Mango Square", from: "USC Gate", to: "Mango Square", date: "Apr 7, 8:10 AM", fare: 0, status: "canceled", cancelReason: "Driver no-show" },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rideHistory, setRideHistory] = useState<RideHistory[]>(MOCK_HISTORY);
  const [activeRole, setActiveRole] = useState<UserRole>("passenger");

  useEffect(() => {
    const loadUser = async () => {
      try {
        const stored = await AsyncStorage.getItem("pasabay_user");
        if (stored) {
          const parsed = JSON.parse(stored) as UserProfile;
          setUser(parsed);
          setActiveRole(parsed.role);
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const saveUser = async (u: UserProfile) => {
    await AsyncStorage.setItem("pasabay_user", JSON.stringify(u));
    setUser(u);
  };

  const signup = useCallback(async (email: string, _password: string) => {
    const newUser: UserProfile = {
      id: Date.now().toString(),
      name: email.split("@")[0].replace(".", " ").replace(/\b\w/g, c => c.toUpperCase()),
      email,
      role: "passenger",
      rating: 5.0,
      totalRides: 0,
      verified: false,
      driverVerified: false,
    };
    await saveUser(newUser);
  }, []);

  const login = useCallback(async (email: string, _password: string) => {
    const existing = await AsyncStorage.getItem("pasabay_user");
    if (existing) {
      const parsed = JSON.parse(existing) as UserProfile;
      if (parsed.email === email) {
        setUser(parsed);
        setActiveRole(parsed.role);
        return;
      }
    }
    const mockUser: UserProfile = {
      id: "demo",
      name: "Juan Dela Cruz",
      email: "juan.delacruz@usc.edu.ph",
      role: "passenger",
      rating: 4.8,
      totalRides: 23,
      verified: true,
      driverVerified: false,
    };
    await saveUser(mockUser);
    setActiveRole(mockUser.role);
  }, []);

  const logout = useCallback(() => {
    AsyncStorage.removeItem("pasabay_user");
    setUser(null);
  }, []);

  const setSchoolIdVerified = useCallback(() => {
    if (!user) return;
    const updated = { ...user, verified: true };
    saveUser(updated);
  }, [user]);

  const setDriverVerified = useCallback((vehicle: UserProfile["vehicle"]) => {
    if (!user) return;
    const updated: UserProfile = { ...user, driverVerified: true, role: "driver", vehicle };
    saveUser(updated);
    setActiveRole("driver");
  }, [user]);

  const switchRole = useCallback((role: UserRole) => {
    setActiveRole(role);
    if (user) {
      const updated = { ...user, role };
      saveUser(updated);
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
      login,
      logout,
      signup,
      setSchoolIdVerified,
      setDriverVerified,
      switchRole,
      addRideHistory,
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
