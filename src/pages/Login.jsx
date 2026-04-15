import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import logo from "@/assets/logo.png";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = location.state?.from?.pathname || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorText, setErrorText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorText("");
    setIsSubmitting(true);

    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (error) {
      console.error("Login failed:", error);
      setErrorText(error.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-8 flex items-center gap-3 bg-transparent border-0 p-0 text-left"
        >
          <img
            src={logo}
            alt="NSBTEK Logo"
            className="h-9 w-auto object-contain sm:h-10"
          />
          <div>
            <p className="text-sm font-bold leading-tight text-white">NSBTEK</p>
            <p className="text-[10px] uppercase tracking-[0.25em] text-blue-400">
              Think Big | AI-First
            </p>
          </div>
        </button>

        <div className="flex flex-1 items-center justify-center">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl sm:p-8"
          >
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Login</h1>
            <p className="mb-6 text-sm leading-6 text-slate-400">
              Sign in to access CRM, ATS, HR, Workforce, and AI tools.
            </p>

            {errorText ? (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {errorText}
              </div>
            ) : null}

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm">Email</label>
                <input
                  type="email"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm">Password</label>
                <input
                  type="password"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
              >
                {isSubmitting ? "Signing in..." : "Login"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}