import React, { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import {
  deleteAttachment,
  getAttachmentSignedUrl,
  listAttachments,
  uploadAttachment,
} from "@/api/attachments";

export default function AttachmentUploader({ module, recordId }) {
  const inputRef = useRef(null);
  const queryClient = useQueryClient();
  const { authUser } = useAuth();

  const { data: attachments = [], isLoading } = useQuery({
    queryKey: ["attachments", module, recordId],
    queryFn: () => listAttachments(module, recordId),
    enabled: !!recordId,
  });

  const uploadMutation = useMutation({
    mutationFn: (file) =>
      uploadAttachment({
        file,
        module,
        recordId,
        currentUser: authUser,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attachments", module, recordId] });
      if (inputRef.current) inputRef.current.value = "";
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAttachment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attachments", module, recordId] });
    },
  });

  const handleOpen = async (attachment) => {
    const url = await getAttachmentSignedUrl(attachment.file_path);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  if (!recordId) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        Save the record first, then upload attachments.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-sm">Attachments</h3>
        <input
          ref={inputRef}
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadMutation.mutate(file);
          }}
          className="text-sm"
        />
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading attachments...</div>
      ) : attachments.length === 0 ? (
        <div className="text-sm text-muted-foreground">No attachments uploaded yet.</div>
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{attachment.file_name}</div>
                <div className="text-xs text-muted-foreground">
                  {attachment.file_type || "file"} • {attachment.file_size || 0} bytes
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleOpen(attachment)}
                  className="rounded-lg border px-3 py-1.5 text-sm"
                >
                  View
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const confirmed = window.confirm("Delete this attachment?");
                    if (confirmed) {
                      deleteMutation.mutate(attachment);
                    }
                  }}
                  className="rounded-lg border border-red-200 text-red-600 px-3 py-1.5 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}