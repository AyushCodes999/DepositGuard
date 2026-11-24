import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("depositguard_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("depositguard_token"));
  const [loading, setLoading] = useState(() => {
    // If we already have a cached user and token, we are immediately ready without blocking
    const hasToken = !!localStorage.getItem("depositguard_token");
    const hasUser = !!localStorage.getItem("depositguard_user");
    return hasToken && !hasUser;
  });

  useEffect(() => {
    if (token) {
      let isMounted = true;
      api.getMe()
        .then((userData) => {
          if (isMounted) {
            setUser(userData);
            try {
              localStorage.setItem("depositguard_user", JSON.stringify(userData));
            } catch {}
          }
        })
        .catch((err) => {
          // CRITICAL BUG FIX FOR REPEATED REFRESH SIGN-OUT:
          // Never log out the user on browser aborts, rapid reload aborts, or temporary connection errors!
          // Only log out if the backend server explicitly returned a 401 Unauthorized (expired/invalid token).
          if (err?.status === 401) {
            logout();
          }
        })
        .finally(() => {
          if (isMounted) {
            setLoading(false);
          }
        });

      return () => {
        isMounted = false;
      };
    } else {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const handleAuthError = () => {
      logout();
    };
    window.addEventListener("depositguard_auth_error", handleAuthError);
    return () => window.removeEventListener("depositguard_auth_error", handleAuthError);
  }, []);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    localStorage.setItem("depositguard_token", data.access_token);
    try {
      localStorage.setItem("depositguard_user", JSON.stringify(data.user));
    } catch {}
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const register = async (email, password, fullName, role, phone = "", otpToken = "") => {
    const data = await api.register({
      email,
      password,
      full_name: fullName,
      role,
      phone,
      otp_token: otpToken
    });
    localStorage.setItem("depositguard_token", data.access_token);
    try {
      localStorage.setItem("depositguard_user", JSON.stringify(data.user));
    } catch {}
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("depositguard_token");
    localStorage.removeItem("depositguard_user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, role: user?.role, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
