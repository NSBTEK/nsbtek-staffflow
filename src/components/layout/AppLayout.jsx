import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import Sidebar from "@/components/layout/Sidebar";
import logo from "@/assets/logo.png";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className="hidden md:block">
          <Sidebar />
        </aside>

        {mobileSidebarOpen ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={closeMobileSidebar}
            />
            <div className="absolute left-0 top-0 h-full w-[280px] max-w-[85vw] bg-background shadow-2xl">
              <div className="flex items-center justify-between border-b px-4 py-4">
                <div className="flex items-center gap-3">
                  <img
                    src={logo}
                    alt="NSBTEK Logo"
                    className="h-8 w-auto object-contain"
                  />
                  <div>
                    <h2 className="text-sm font-semibold">NSBTEK StaffFlow</h2>
                  </div>
                </div>
                <button
                  onClick={closeMobileSidebar}
                  className="rounded-lg border px-2 py-2"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="h-[calc(100%-73px)] overflow-y-auto">
                <Sidebar onNavigate={closeMobileSidebar} mobile />
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-3 sm:px-4 md:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="rounded-lg border p-2 md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              <img
                src={logo}
                alt="NSBTEK Logo"
                className="h-8 w-auto object-contain"
              />

              <div className="min-w-0">
                <h1 className="truncate text-sm font-semibold sm:text-base">
                  NSBTEK StaffFlow
                </h1>
                <p className="truncate text-[11px] text-muted-foreground sm:text-xs">
                  Welcome, {user?.full_name?.trim() || user?.email || "User"}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-600 sm:px-4"
            >
              Logout
            </button>
          </header>

          <main className="flex-1 p-3 sm:p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}