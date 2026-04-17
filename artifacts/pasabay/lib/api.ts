import AsyncStorage from "@react-native-async-storage/async-storage";

const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN ?? "localhost";
const IS_DEV = process.env.EXPO_PUBLIC_DOMAIN !== undefined && process.env.EXPO_PUBLIC_DOMAIN !== "localhost";

export const API_BASE = IS_DEV
  ? `https://${DOMAIN}:8080/api`
  : `http://localhost:8080/api`;

const ACCESS_KEY = "pasabay_access_token";
const REFRESH_KEY = "pasabay_refresh_token";

export async function getTokens(): Promise<{ access: string | null; refresh: string | null }> {
  const [access, refresh] = await Promise.all([
    AsyncStorage.getItem(ACCESS_KEY),
    AsyncStorage.getItem(REFRESH_KEY),
  ]);
  return { access, refresh };
}

export async function setTokens(access: string, refresh: string) {
  await Promise.all([
    AsyncStorage.setItem(ACCESS_KEY, access),
    AsyncStorage.setItem(REFRESH_KEY, refresh),
  ]);
}

export async function clearTokens() {
  await Promise.all([
    AsyncStorage.removeItem(ACCESS_KEY),
    AsyncStorage.removeItem(REFRESH_KEY),
  ]);
}

async function refreshAccessToken(): Promise<string | null> {
  const { refresh } = await getTokens();
  if (!refresh) return null;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    if (!res.ok) {
      await clearTokens();
      return null;
    }
    const data = await res.json() as { accessToken: string; refreshToken: string };
    await setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

export interface ApiError {
  status: number;
  message: string;
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const { access } = await getTokens();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (access) {
    headers.Authorization = `Bearer ${access}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401 && retry) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      return apiRequest<T>(path, options, false);
    }
    const err: ApiError = { status: 401, message: "Session expired. Please log in again." };
    throw err;
  }

  const body = await res.json() as { error?: string; message?: string } & T;

  if (!res.ok) {
    const err: ApiError = {
      status: res.status,
      message: (body as any).error ?? (body as any).message ?? "Request failed",
    };
    throw err;
  }

  return body;
}
