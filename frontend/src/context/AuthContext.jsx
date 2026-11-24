import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export const DEFAULT_USER = {
  id: "07c9fbf4-8d4a-4d3a-a36e-5ea11f3111bc",
  email: "ayushrajchandelarc@gmail.com",
  full_name: "Aayush Raj",
  role: "landlord",
  phone: "+91 98765 43210"
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("depositguard_user");
      return saved ? JSON.parse(saved) : DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem("depositguard_token") || "demo_token");
  const [loading, setLoading] = useState(false);

  // Keep localStorage continuously primed so user is never empty
  useEffect(() => {
    try {
      localStorage.setItem("depositguard_user", JSON.stringify(user || DEFAULT_USER));
      if (!localStorage.getItem("depositguard_token")) {
        localStorage.setItem("depositguard_token", "demo_token");
      }
    } catch {}
  }, [user]);

  // Sync profile details with backend
  useEffect(() => {
    api.getMe()
      .then((userData) => {
        if (userData && userData.id) {
          setUser(userData);
          try {
            localStorage.setItem("depositguard_user", JSON.stringify(userData));
          } catch {}
        }
      })
      .catch(() => {
        // Fall back gracefully to DEFAULT_USER without interrupting navigation
      });
  }, []);

  const switchRole = (desiredRole) => {
    setUser((prev) => {
      const currentRole = prev?.role || "landlord";
      const nextRole = desiredRole || (currentRole === "landlord" ? "tenant" : "landlord");
      const updated = {
        ...(prev || DEFAULT_USER),
        role: nextRole
      };
      try {
        localStorage.setItem("depositguard_user", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const login = async (email, password) => {
    try {
      const data = await api.login({ email, password });
      if (data?.user) {
        setUser(data.user);
        return data.user;
      }
    } catch {}
    return user || DEFAULT_USER;
  };

  const register = async () => {
    return user || DEFAULT_USER;
  };

  const logout = () => {
    // In auth-free mode, reset to DEFAULT_USER rather than locking the user out
    setUser(DEFAULT_USER);
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || DEFAULT_USER,
        token: token || "demo_token",
        role: user?.role || "landlord",
        login,
        register,
        logout,
        switchRole,
        loading: false
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
