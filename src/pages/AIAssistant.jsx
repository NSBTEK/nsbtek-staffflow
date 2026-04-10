import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AIAssistant() {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorText("");
    setReply("");

    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: { prompt },
      });

      if (error) {
        throw error;
      }

      setReply(data?.reply || "No response received.");
    } catch (error) {
      setErrorText(error.message || "Unable to connect to AI service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Assistant</h1>
        <p className="text-muted-foreground">
          Ask staffing, CRM, ATS, HR, and workforce-related questions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border bg-card p-6 space-y-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask something like: Summarize this candidate profile, draft a client follow-up, or suggest next ATS steps."
          rows={6}
          className="w-full border rounded-xl px-4 py-3"
          required
        />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 font-medium disabled:opacity-60"
          >
            {loading ? "Thinking..." : "Ask AI"}
          </button>
        </div>
      </form>

      {errorText ? (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3">
          ⚠️ {errorText}
        </div>
      ) : null}

      {reply ? (
        <div className="rounded-2xl border bg-card p-6">
          <h2 className="text-lg font-semibold mb-3">AI Response</h2>
          <div className="whitespace-pre-wrap text-sm leading-7">{reply}</div>
        </div>
      ) : null}
    </div>
  );
}