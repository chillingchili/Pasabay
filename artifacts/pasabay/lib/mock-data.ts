export interface MockDriver {
  id: string;
  name: string;
  rating: number;
  vehicle: {
    make: string;
    model: string;
    color: string;
    plate: string;
    seats: number;
  };
  avatar?: string;
}

export interface MockPassenger {
  id: string;
  name: string;
  rating: number;
  avatar?: string;
}

export interface SimulatedRoute {
  name: string;
  distanceKm: number;
  durationMin: number;
  polyline: { lat: number; lng: number }[];
}

export const MOCK_DRIVERS: MockDriver[] = [
  {
    id: "d1",
    name: "Maria Santos",
    rating: 4.8,
    vehicle: { make: "Toyota", model: "Vios", color: "Silver", plate: "ABC 123", seats: 4 },
    avatar: undefined,
  },
  {
    id: "d2",
    name: "Juan Cruz",
    rating: 4.6,
    vehicle: { make: "Honda", model: "City", color: "White", plate: "DEF 456", seats: 4 },
    avatar: undefined,
  },
  {
    id: "d3",
    name: "Ana Reyes",
    rating: 4.9,
    vehicle: { make: "Mitsubishi", model: "Mirage", color: "Red", plate: "GHI 789", seats: 4 },
    avatar: undefined,
  },
];

export const MOCK_PASSENGERS: MockPassenger[] = [
  { id: "p1", name: "Pedro Lim", rating: 4.7 },
  { id: "p2", name: "Liza Mae", rating: 4.9 },
  { id: "p3", name: "Carlo Yu", rating: 4.5 },
];

export const SIMULATED_ROUTES: Record<string, SimulatedRoute> = {
  "USC-Talamban": {
    name: "USC Talamban",
    distanceKm: 6.5,
    durationMin: 15,
    polyline: [
      { lat: 10.2969, lng: 123.8980 },
      { lat: 10.3100, lng: 123.9050 },
      { lat: 10.3300, lng: 123.9080 },
      { lat: 10.3450, lng: 123.9090 },
      { lat: 10.3535, lng: 123.9135 },
    ],
  },
  "ITPark-Ayala": {
    name: "IT Park to Ayala",
    distanceKm: 4.1,
    durationMin: 12,
    polyline: [
      { lat: 10.3308, lng: 123.9068 },
      { lat: 10.3260, lng: 123.9120 },
      { lat: 10.3220, lng: 123.9080 },
      { lat: 10.3190, lng: 123.9060 },
      { lat: 10.3173, lng: 123.9046 },
    ],
  },
  "SM-Mango": {
    name: "SM City to Mango Square",
    distanceKm: 1.5,
    durationMin: 5,
    polyline: [
      { lat: 10.3112, lng: 123.9172 },
      { lat: 10.3105, lng: 123.9130 },
      { lat: 10.3100, lng: 123.9080 },
      { lat: 10.3095, lng: 123.9010 },
      { lat: 10.3090, lng: 123.8993 },
    ],
  },
};

export function getRandomDriver(): MockDriver {
  return MOCK_DRIVERS[Math.floor(Math.random() * MOCK_DRIVERS.length)];
}

export function getRandomPassenger(): MockPassenger {
  return MOCK_PASSENGERS[Math.floor(Math.random() * MOCK_PASSENGERS.length)];
}

export function getRandomRoute(): SimulatedRoute {
  const routes = Object.values(SIMULATED_ROUTES);
  return routes[Math.floor(Math.random() * routes.length)];
}