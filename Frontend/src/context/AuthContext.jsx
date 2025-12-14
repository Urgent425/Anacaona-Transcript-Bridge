// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);

  const loadUser = useCallback(async () => {
    try {
      const t = localStorage.getItem("token");
      if (!t) { setUser(null); return; }
      const cached = localStorage.getItem("user");
      if (cached) { setUser(JSON.parse(cached)); return; }

      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) throw new Error("unauthorized");
      const me = await res.json();
      localStorage.setItem("user", JSON.stringify(me));
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  // ✅ Synchronous update so Navbar re-renders immediately
  const login = (t, u) => {
    localStorage.setItem("token", t);
    setToken(t);
    if (u) {
      localStorage.setItem("user", JSON.stringify(u));
      setUser(u);               // immediate re-render
    } else {
      // if no user payload, fetch it
      loadUser();
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, reloadUser: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
