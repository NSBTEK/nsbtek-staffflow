import { signOut } from "@/lib/auth/session";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";

export default function AppHeader() {
  const { profile } = useProfile();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-900">
            {profile?.full_name || "User"}
          </div>
          <div className="truncate text-xs text-slate-500">
            {profile?.email || ""}
          </div>
        </div>

        <Button variant="outline" onClick={signOut}>
          Sign out
        </Button>
      </div>
    </header>
  );
}