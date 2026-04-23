import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/lib/AuthContext";
import {
  uploadDocumentForParsing,
  runDocumentParse,
} from "@/lib/documentIngestion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ResumeParser() {
  const { authUser } = useAuth();
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [result, setResult] = useState(null);

  const isBusy = isUploading || isParsing;

  const handleParse = async () => {
    if (!authUser?.id) {
      toast.error("You must be logged in");
      return;
    }

    if (!file) {
      toast.error("Please choose a resume file first");
      return;
    }

    if (isBusy) return;

    try {
      setResult(null);
      setIsUploading(true);

      const ingestion = await uploadDocumentForParsing({
        currentUser: authUser,
        file,
        moduleTarget: "candidates",
      });

      setIsUploading(false);
      setIsParsing(true);

      const parsed = await runDocumentParse(ingestion.id);
      setResult(parsed);

      if (parsed?.status === "queued") {
        toast.warning(
          parsed?.message ||
            "Resume parser is temporarily rate-limited. Your file was uploaded and queued."
        );
      } else {
        toast.success("Resume parsed successfully");
      }
    } catch (error) {
      console.error("Resume parse failed:", error);

      const message =
        error?.message ||
        "Resume parsing failed. Please wait a moment and try again.";

      setResult({
        success: false,
        status: "failed",
        message,
      });

      toast.error(message);
    } finally {
      setIsUploading(false);
      setIsParsing(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Resume Parser</h2>
          <p className="mt-1 text-sm text-slate-500">
            Upload a resume and parse it into structured candidate information.
          </p>

          <div className="mt-6 space-y-4">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={isBusy}
              className="block w-full text-sm"
            />

            <Button onClick={handleParse} disabled={!file || isBusy}>
              {isUploading
                ? "Uploading..."
                : isParsing
                ? "Parsing..."
                : "Parse Document"}
            </Button>
          </div>
        </div>

        {result ? (
  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <h3 className="text-base font-semibold text-slate-900">Parser Status</h3>

    {result.status === "queued" || result.status === "queued_or_failed" ? (
      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Resume was uploaded successfully, but parsing is unavailable right now because the backend AI API quota is exhausted.
        Add API billing or replace the API key used by the Supabase function to enable parsing.
      </div>
    ) : (
      <pre className="mt-4 overflow-auto rounded-2xl bg-slate-50 p-4 text-xs text-slate-700">
        {JSON.stringify(result, null, 2)}
      </pre>
    )}
  </div>
) : null}
      </div>
    </AppLayout>
  );
}