import { pool } from "@workspace/db";
import { logger } from "./logger.js";

const MIGRATION_SQL = `
  -- Enums
  DO $$ BEGIN CREATE TYPE user_role AS ENUM ('passenger', 'driver');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;

  DO $$ BEGIN CREATE TYPE verification_status AS ENUM ('pending', 'submitted', 'verified', 'rejected');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;

  DO $$ BEGIN CREATE TYPE route_status AS ENUM ('active', 'completed', 'canceled');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;

  DO $$ BEGIN CREATE TYPE ride_status AS ENUM ('matched','driver_en_route','passenger_picked_up','completed','canceled_driver','canceled_passenger','no_show');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;

  -- Users
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    name TEXT NOT NULL,
    google_id TEXT UNIQUE,
    avatar TEXT,
    role user_role NOT NULL DEFAULT 'passenger',
    school_id_status verification_status NOT NULL DEFAULT 'pending',
    school_id_image_url TEXT,
    driver_status verification_status NOT NULL DEFAULT 'pending',
    driver_license_image_url TEXT,
    rating REAL NOT NULL DEFAULT 5.0,
    rating_count INTEGER NOT NULL DEFAULT 0,
    total_rides INTEGER NOT NULL DEFAULT 0,
    shadow_banned BOOLEAN NOT NULL DEFAULT false,
    active_role user_role NOT NULL DEFAULT 'passenger',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  -- Vehicles
  CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plate TEXT NOT NULL,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    color TEXT NOT NULL,
    seats INTEGER NOT NULL,
    fuel_efficiency REAL NOT NULL DEFAULT 20,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  -- Refresh tokens
  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  -- Active driver routes
  CREATE TABLE IF NOT EXISTS active_routes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    driver_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    origin_name TEXT NOT NULL,
    origin_lat REAL NOT NULL,
    origin_lng REAL NOT NULL,
    dest_name TEXT NOT NULL,
    dest_lat REAL NOT NULL,
    dest_lng REAL NOT NULL,
    polyline JSONB NOT NULL DEFAULT '[]',
    distance_km REAL NOT NULL,
    current_lat REAL NOT NULL,
    current_lng REAL NOT NULL,
    status route_status NOT NULL DEFAULT 'active',
    available_seats TEXT NOT NULL DEFAULT '3',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  -- Rides
  CREATE TABLE IF NOT EXISTS rides (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    route_id TEXT REFERENCES active_routes(id),
    driver_id TEXT NOT NULL REFERENCES users(id),
    vehicle_id TEXT REFERENCES vehicles(id),
    from_name TEXT NOT NULL,
    from_lat REAL NOT NULL,
    from_lng REAL NOT NULL,
    to_name TEXT NOT NULL,
    to_lat REAL NOT NULL,
    to_lng REAL NOT NULL,
    total_distance_km REAL NOT NULL,
    fuel_price_php REAL NOT NULL DEFAULT 65,
    status ride_status NOT NULL DEFAULT 'matched',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  -- Ride passengers
  CREATE TABLE IF NOT EXISTS ride_passengers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    ride_id TEXT NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    passenger_id TEXT NOT NULL REFERENCES users(id),
    pickup_name TEXT NOT NULL,
    pickup_lat REAL NOT NULL,
    pickup_lng REAL NOT NULL,
    dropoff_name TEXT NOT NULL,
    dropoff_lat REAL NOT NULL,
    dropoff_lng REAL NOT NULL,
    distance_km REAL NOT NULL,
    fare REAL NOT NULL,
    matching_fee REAL NOT NULL DEFAULT 8,
    status TEXT NOT NULL DEFAULT 'matched',
    passenger_rating INTEGER,
    driver_rating_given INTEGER,
    rated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  -- Indexes
  CREATE INDEX IF NOT EXISTS idx_active_routes_driver ON active_routes(driver_id);
  CREATE INDEX IF NOT EXISTS idx_active_routes_status ON active_routes(status);
  CREATE INDEX IF NOT EXISTS idx_rides_driver ON rides(driver_id);
  CREATE INDEX IF NOT EXISTS idx_ride_passengers_passenger ON ride_passengers(passenger_id);
  CREATE INDEX IF NOT EXISTS idx_ride_passengers_ride ON ride_passengers(ride_id);
  CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
`;

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(MIGRATION_SQL);
    logger.info("Database migrations applied successfully");
  } catch (err) {
    logger.error({ err }, "Database migration failed");
    throw err;
  } finally {
    client.release();
  }
}
