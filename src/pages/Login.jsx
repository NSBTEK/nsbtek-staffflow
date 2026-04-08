import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

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
      await login(email, password);
      navigate(from, { replace: true });
    } catch (error) {
      setErrorText(error.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white grid place-items-center px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-slate-900 rounded-2xl p-8 border border-slate-800 shadow-2xl"
      >
        <h1 className="text-3xl font-bold mb-2">Login</h1>
        <p className="text-slate-400 mb-6">
          Sign in to access CRM, ATS, and workforce tools.
        </p>

        <div className="mb-4">
          <label className="block mb-2 text-sm text-slate-300">Email</label>
          <input
            type="email"
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2 text-sm text-slate-300">Password</label>
          <input
            type="password"
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {errorText ? (
          <div className="mb-4 rounded-xl bg-red-500/10 text-red-300 px-4 py-3 text-sm">
            {errorText}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 transition px-4 py-3 font-semibold disabled:opacity-60"
        >
          {isSubmitting ? "Signing in..." : "Login"}
        </button>
      </form>
    </div>
  );
}