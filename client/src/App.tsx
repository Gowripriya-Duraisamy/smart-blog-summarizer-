import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import LogoutOutlined from "@mui/icons-material/LogoutOutlined";
import axios from "axios";
import DocAssit from "./components";
import { signInWithGoogle } from "./services/api";
import {
  AuthSession,
  clearAuthSession,
  getStoredAuthSession,
  storeAuthSession,
} from "./services/auth";

declare global {
  interface Window {
    google?: any;
  }
}

const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

function App() {
  const [session, setSession] = useState<AuthSession | null>(() =>
    getStoredAuthSession(),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session || !googleClientId) return;

    const initializeGoogleButton = () => {
      if (!window.google || !googleButtonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response: { credential?: string }) => {
          if (!response.credential) {
            setError("Google did not return a sign-in credential.");
            return;
          }

          try {
            setLoading(true);
            setError("");
            const nextSession = await signInWithGoogle(response.credential);
            storeAuthSession(nextSession);
            setSession(nextSession);
          } catch (error) {
            const message = axios.isAxiosError(error)
              ? error.response?.data?.message
              : "";

            setError(
              message || "Unable to sign in with Google. Please try again.",
            );
          } finally {
            setLoading(false);
          }
        },
      });

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        shape: "rectangular",
        width: 280,
      });
    };

    if (window.google) {
      initializeGoogleButton();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleButton;
    script.onerror = () => {
      setError("Unable to load Google Sign-In.");
    };
    document.body.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, [session]);

  const handleLogout = () => {
    clearAuthSession();
    setSession(null);
  };

  if (!session) {
    return (
      <Box
        sx={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
          background: "linear-gradient(135deg, #f8f5f0 0%, #fdfaf6 100%)",
        }}
      >
        <Stack
          spacing={2}
          sx={{
            width: "100%",
            maxWidth: 420,
            p: 4,
            borderRadius: 3,
            bgcolor: "#ffffff",
            border: "1px solid #e5e7eb",
            boxShadow: "0 18px 44px rgba(15,23,42,0.12)",
            textAlign: "center",
            alignItems: "center",
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            AI Document Assistant
          </Typography>
          <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
            Sign in to access your uploaded documents and chat history.
          </Typography>

          {!googleClientId ? (
            <Alert severity="warning">
              Add REACT_APP_GOOGLE_CLIENT_ID to enable Google sign-in.
            </Alert>
          ) : (
            <Box sx={{ minHeight: 44 }}>
              <div ref={googleButtonRef} />
            </Box>
          )}

          {loading && <CircularProgress size={24} />}
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100dvh", position: "relative" }}>
      <Box
        sx={{
          position: "absolute",
          top: 10,
          right: 16,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1,
          py: 0.75,
          borderRadius: 2,
          bgcolor: "rgba(255,255,255,0.92)",
          border: "1px solid #e5e7eb",
          boxShadow: "0 8px 20px rgba(15,23,42,0.08)",
        }}
      >
        <Avatar src={session.user.picture} sx={{ width: 28, height: 28 }}>
          {session.user.name.charAt(0)}
        </Avatar>
        <Typography
          variant="body2"
          sx={{
            maxWidth: 160,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontWeight: 700,
          }}
        >
          {session.user.name}
        </Typography>
        <Button
          size="small"
          color="inherit"
          onClick={handleLogout}
          sx={{ minWidth: 32, px: 0.5 }}
        >
          <LogoutOutlined fontSize="small" />
        </Button>
      </Box>
      <DocAssit />
    </Box>
  );
}

export default App;
