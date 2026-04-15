import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function TimesheetAttachmentUpload({ timesheetId, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !timesheetId) return;

    try {
      setUploading(true);
      setError("");

      const ext = file.name.split(".").pop();
      const path = `timesheets/${timesheetId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from("attachments").upload(path, file, { upsert: false });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("attachments").getPublicUrl(path);

      const { error: rowError } = await supabase.from("timesheet_attachments").insert({
        timesheet_id: timesheetId,
        file_name: file.name,
        file_url: data.publicUrl,
      });
      if (rowError) throw rowError;

      onUploaded?.();
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Upload weekly proof / screenshot / document</label>
      <input type="file" onChange={handleUpload} className="block w-full" />
      {uploading && <p className="text-sm text-muted-foreground">Uploading attachment...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
