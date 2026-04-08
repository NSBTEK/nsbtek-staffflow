import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import Sidebar from "@/components/layout/Sidebar";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />

      <div className="flex-1 min-w-0">
        <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h1 className="text-base font-semibold">NSBTEK StaffFlow</h1>
            <p className="text-xs text-muted-foreground">
              Welcome, {user?.full_name || user?.email}
            </p>
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