import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";

const AuthContext = createContext(null);

function buildFallbackProfile(user) {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    full_name:
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "User",
    role: user.user_metadata?.role || "viewer",
    status: "active",
    module_access: {
      dashboard: true,
      request_access: true,
    },
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const loadProfile = async (user) => {
    if (!user?.id) {
      setProfile(null);
      return null;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Profile load error:", error);
      const fallback = buildFallbackProfile(user);
      setProfile(fallback);
      return fallback;
    }

    const finalProfile = data || buildFallbackProfile(user);
    setProfile(finalProfile);
    return finalProfile;
  };

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        setSession(session || null);
        setAuthUser(session?.user || null);

        if (session?.user) {
          await loadProfile(session.user);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Bootstrap auth error:", error);
      } finally {
        if (mounted) setIsLoadingAuth(false);
      }
    }

    bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
      setAuthUser(nextSession?.user || null);
      setIsLoadingAuth(false);

      if (nextSession?.user) {
        loadProfile(nextSession.user);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    setSession(data.session || null);
    setAuthUser(data.user || null);
    setProfile(buildFallbackProfile(data.user));

    if (data.user) {
      loadProfile(data.user);
    }

    return data;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    setSession(null);
    setAuthUser(null);
    setProfile(null);
  };

  const value = useMemo(
    () => ({
      session,
      authUser,
      user: profile,
      isAuthenticated: !!session,
      isLoadingAuth,
      login,
      logout,
    }),
    [session, authUser, profile, isLoadingAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}