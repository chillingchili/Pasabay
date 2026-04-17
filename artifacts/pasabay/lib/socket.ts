import { io, Socket } from "socket.io-client";
import { getTokens } from "./api";

const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN;
const IS_DEV = DOMAIN !== undefined && DOMAIN !== "localhost";

const SOCKET_URL = IS_DEV
  ? `https://${DOMAIN}:8080`
  : "http://localhost:8080";

let socket: Socket | null = null;

export async function connectSocket(): Promise<Socket> {
  if (socket?.connected) return socket;

  const { access } = await getTokens();
  if (!access) throw new Error("No access token");

  socket = io(SOCKET_URL, {
    auth: { token: access },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Socket connection timeout"));
    }, 10000);

    socket!.once("connect", () => {
      clearTimeout(timeout);
      resolve(socket!);
    });

    socket!.once("connect_error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}

export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}

export type MatchRequestPayload = {
  passengerId: string;
  passengerName: string;
  passengerRating: number;
  passengerAvatar: string | null;
  routeId: string;
  pickup: { lat: number; lng: number; name: string };
  dropoff: { lat: number; lng: number; name: string };
  distanceKm: number;
  fare: number;
  matchingFee: number;
  total: number;
  pickupEtaMin: number;
};

export type MatchConfirmedPayload = {
  rideId: string;
  driver: {
    id: string;
    name: string;
    rating: number;
    avatar: string | null;
    vehicle: {
      make: string;
      model: string;
      color: string;
      plate: string;
      seats: number;
    } | null;
  };
  pickup: { lat: number; lng: number; name: string };
  dropoff: { lat: number; lng: number; name: string };
  fare: number;
  matchingFee: number;
  total: number;
  distanceKm: number;
};

export type RideCompletedPayload = {
  rideId: string;
  fare: number;
  matchingFee: number;
  total: number;
  distanceKm: number;
  message: string;
};

export type DriverLocationPayload = {
  driverId: string;
  routeId: string;
  lat: number;
  lng: number;
  heading?: number;
};

export function emitDriverOnline(data: {
  originName: string; originLat: number; originLng: number;
  destName: string; destLat: number; destLng: number;
}) {
  socket?.emit("driver:online", data);
}

export function emitDriverLocation(lat: number, lng: number, heading?: number) {
  socket?.emit("driver:location", { lat, lng, heading });
}

export function emitDriverOffline() {
  socket?.emit("driver:offline");
}

export function emitMatchAccept(data: {
  routeId: string;
  passengerId: string;
  pickupLat: number; pickupLng: number;
  dropoffLat: number; dropoffLng: number;
  pickupName: string; dropoffName: string;
  fare: number; matchingFee: number; distanceKm: number;
}) {
  socket?.emit("match:accept", data);
}

export function emitMatchDecline(passengerId: string) {
  socket?.emit("match:decline", { passengerId });
}

export function emitRideComplete(rideId: string) {
  socket?.emit("ride:complete", { rideId });
}

export function emitRideCancel(rideId: string, reason: string) {
  socket?.emit("ride:cancel", { rideId, reason });
}

export function onMatchRequest(cb: (data: MatchRequestPayload) => void) {
  socket?.on("match:request", cb);
  return () => { socket?.off("match:request", cb); };
}

export function onMatchConfirmed(cb: (data: MatchConfirmedPayload) => void) {
  socket?.on("match:confirmed", cb);
  return () => { socket?.off("match:confirmed", cb); };
}

export function onMatchDeclined(cb: (data: { message: string }) => void) {
  socket?.on("match:declined", cb);
  return () => { socket?.off("match:declined", cb); };
}

export function onMatchAccepted(cb: (data: { rideId: string; passengerId: string }) => void) {
  socket?.on("match:accepted_confirmed", cb);
  return () => { socket?.off("match:accepted_confirmed", cb); };
}

export function onRideCompleted(cb: (data: RideCompletedPayload) => void) {
  socket?.on("ride:completed", cb);
  return () => { socket?.off("ride:completed", cb); };
}

export function onRideCanceled(cb: (data: { rideId: string; canceledBy: string; reason: string }) => void) {
  socket?.on("ride:canceled", cb);
  return () => { socket?.off("ride:canceled", cb); };
}

export function onDriverLocationUpdate(cb: (data: DriverLocationPayload) => void) {
  socket?.on("driver:location_update", cb);
  return () => { socket?.off("driver:location_update", cb); };
}

export function onDriverRouteSet(cb: (data: { routeId: string; distanceKm: number; durationMin: number; polyline: { lat: number; lng: number }[] }) => void) {
  socket?.on("driver:route_set", cb);
  return () => { socket?.off("driver:route_set", cb); };
}

export function onDriverError(cb: (data: { message: string }) => void) {
  socket?.on("driver:error", cb);
  return () => { socket?.off("driver:error", cb); };
}
