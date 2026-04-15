import React, { useState } from "react";
import { uploadDocumentToParser, mapParsedResumeToCandidate } from "@/lib/parsing";

export default function ResumeUploadField({ onParsed }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError("");
      const result = await uploadDocumentToParser(file);
      const mapped = mapParsedResumeToCandidate(result.parsed || result);
      onParsed({ mapped, raw: result, file });
    } catch (err) {
      setError(err.message || "Failed to parse document");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Upload Resume</label>
      <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFile} className="block w-full" />
      {loading && <p className="text-sm text-muted-foreground">Parsing resume...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
