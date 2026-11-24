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

  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem("depositguard_token") || null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  // Sync profile details with backend on initial load if token exists
  useEffect(() => {
    if (token) {
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
          // If token expired or invalid, reset user and token
          localStorage.removeItem("depositguard_token");
          localStorage.removeItem("depositguard_user");
          setUser(null);
          setToken(null);
        });
    }
  }, [token]);

  const switchRole = (desiredRole) => {
    if (!user) return;
    const currentRole = user.role || "landlord";
    const nextRole = desiredRole || (currentRole === "landlord" ? "tenant" : "landlord");
    const updated = { ...user, role: nextRole };
    setUser(updated);
    try {
      localStorage.setItem("depositguard_user", JSON.stringify(updated));
    } catch {}
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await api.login({ email, password });
      if (data?.access_token && data?.user) {
        localStorage.setItem("depositguard_token", data.access_token);
        localStorage.setItem("depositguard_user", JSON.stringify(data.user));
        setToken(data.access_token);
        setUser(data.user);
        return data.user;
      }
      throw new Error("Login failed. No token received.");
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, fullName, role, phone) => {
    setLoading(true);
    try {
      const data = await api.register({
        email,
        password,
        full_name: fullName,
        role: role || "tenant",
        phone: phone || undefined
      });
      if (data?.access_token && data?.user) {
        localStorage.setItem("depositguard_token", data.access_token);
        localStorage.setItem("depositguard_user", JSON.stringify(data.user));
        setToken(data.access_token);
        setUser(data.user);
        return data.user;
      }
      throw new Error("Registration failed. No token received.");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("depositguard_token");
    localStorage.removeItem("depositguard_user");
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || "landlord",
        login,
        register,
        logout,
        switchRole,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
