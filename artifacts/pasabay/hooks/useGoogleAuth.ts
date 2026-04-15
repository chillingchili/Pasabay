import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { useState } from "react";

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

WebBrowser.maybeCompleteAuthSession();

function getRedirectUri(): string {
  if (Platform.OS === "web") {
    return `${window.location.origin}/auth/callback`;
  }
  return Linking.createURL("auth/callback");
}

export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo | null> {
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export function useGoogleAuth() {
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = async (): Promise<GoogleUserInfo | null> => {
    const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn("[GoogleAuth] EXPO_PUBLIC_GOOGLE_CLIENT_ID is not set");
      return null;
    }

    setLoading(true);
    try {
      const redirectUri = getRedirectUri();

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "token",
        scope: "openid email profile",
        hd: "usc.edu.ph",
        prompt: "select_account",
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

      if (Platform.OS === "web") {
        window.location.href = authUrl;
        return null;
      }

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri, {
        showInRecents: true,
      });

      if (result.type !== "success") return null;

      const fragment = new URLSearchParams(new URL(result.url).hash.slice(1));
      const accessToken = fragment.get("access_token");
      if (!accessToken) return null;

      return fetchGoogleUserInfo(accessToken);
    } catch (err) {
      console.error("[GoogleAuth] Error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { signInWithGoogle, loading };
}
