import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("Checking reset session...");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const hash = window.location.hash.startsWith("#")
          ? window.location.hash.slice(1)
          : window.location.hash;

        const params = new URLSearchParams(hash);

        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        const type = params.get("type");

        if (
          (type === "recovery" || type === "invite") &&
          access_token &&
          refresh_token
        ) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (error) throw error;

          window.history.replaceState({}, document.title, "/reset-password");
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session) {
          setReady(true);
          setStatus("");
        } else {
          setReady(false);
          setStatus("This reset link is invalid or has expired.");
        }
      } catch (error) {
        if (!mounted) return;
        setReady(false);
        setStatus(error?.message || "Could not verify reset link.");
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setStatus("Please enter and confirm your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setStatus("Password must be at least 8 characters.");
      return;
    }

    try {
      setSaving(true);
      setStatus("Updating password...");

      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setStatus("Password updated successfully. Redirecting to login...");

      await supabase.auth.signOut();

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1500);
    } catch (error) {
      setStatus(error?.message || "Could not update password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm sm:p-8">
          <h1 className="text-2xl font-semibold sm:text-3xl">Reset Password</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Enter your new password below.
          </p>

          {status ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
              {status}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!ready || saving}
                className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                placeholder="Enter new password"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={!ready || saving}
                className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                placeholder="Confirm new password"
              />
            </div>

            <button
              type="submit"
              disabled={!ready || saving}
              className="w-full rounded-2xl bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Set Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}