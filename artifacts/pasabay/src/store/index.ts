import { create } from "zustand";
import type { Socket } from "socket.io-client";

interface User {
  id: string;
  email: string;
  name: string;
  role?: "driver" | "rider";
}

interface StoreState {
  user: User | null;
  isAuthenticated: boolean;
  socket: Socket | null;
  setUser: (user: User | null) => void;
  setSocket: (socket: Socket | null) => void;
  logout: () => void;
}

export const useStore = create<StoreState>((set) => ({
  user: null,
  isAuthenticated: false,
  socket: null,
  setUser: (user) =>
    set({
      user,
      isAuthenticated: user !== null,
    }),
  setSocket: (socket) => set({ socket }),
  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      socket: null,
    }),
}));
