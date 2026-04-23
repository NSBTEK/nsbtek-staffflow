import AppSidebar from "@/components/app-shell/AppSidebar";
import AppHeader from "@/components/app-shell/AppHeader";

export default function AppShell({ children }) {
  return (
    <div className="h-screen overflow-hidden bg-slate-50 text-slate-900">
      <div className="flex h-full">
        <AppSidebar />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto">
            <div className="min-h-full p-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}