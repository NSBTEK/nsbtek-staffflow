import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function init() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!active) return;

        if (error) {
          console.error("getSession error:", error);
        }

        setSession(data?.session ?? null);
        setAuthUser(data?.session?.user ?? null);
      } catch (error) {
        if (active) {
          console.error("Auth init failed:", error);
          setSession(null);
          setAuthUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!active) return;
      setSession(newSession ?? null);
      setAuthUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    setSession(data?.session ?? null);
    setAuthUser(data?.user ?? data?.session?.user ?? null);

    return data;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    setSession(null);
    setAuthUser(null);
  };

  const value = useMemo(
    () => ({
      authUser,
      user: authUser,
      session,
      loading,
      authLoading: loading,
      login,
      logout,
      isAuthenticated: !!authUser,
    }),
    [authUser, session, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}