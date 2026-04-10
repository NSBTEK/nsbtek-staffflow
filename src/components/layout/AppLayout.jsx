import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useCurrentUser } from "@/lib/useCurrentUser";
import Sidebar from "@/components/layout/Sidebar";
import logo from "@/assets/logo.png";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { isLoading, error } = useCurrentUser();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading navigation...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
        <div className="max-w-xl w-full rounded-2xl border border-red-200 bg-card p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-red-600">Navigation failed to load</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account is logged in, but the app could not load the navigation profile.
            Please check the <code>profiles</code> table, <code>organization_id</code>,
            and your RLS policies.
          </p>
          <pre className="mt-4 overflow-auto rounded-lg bg-muted p-3 text-xs text-red-600 whitespace-pre-wrap">
            {String(error?.message || error)}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />

      <div className="flex-1 min-w-0">
        <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="NSBTEK Logo"
              className="h-8 w-auto object-contain"
            />
            <div>
              <h1 className="text-base font-semibold">NSBTEK StaffFlow</h1>
              <p className="text-xs text-muted-foreground">
                Welcome, {user?.full_name || user?.email}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-500 hover:bg-red-600 text-white px-4 py-2 text-sm font-medium"
          >
            Logout
          </button>
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}