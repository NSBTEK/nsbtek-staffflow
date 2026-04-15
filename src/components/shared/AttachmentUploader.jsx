import React, { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import {
  deleteAttachment,
  getAttachmentSignedUrl,
  listAttachments,
  uploadAttachment,
} from "@/api/attachments";
import { Button } from "@/components/ui/button";
import { Paperclip, Trash2, Upload, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function AttachmentUploader({ module, recordId }) {
  const inputRef = useRef(null);
  const queryClient = useQueryClient();
  const { authUser } = useAuth();
  const [openingId, setOpeningId] = useState(null);

  const { data: attachments = [], isLoading } = useQuery({
    queryKey: ["attachments", module, recordId],
    queryFn: () => listAttachments(module, recordId),
    enabled: !!module && !!recordId,
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file }) =>
      uploadAttachment({
        file,
        module,
        recordId,
        currentUser: authUser,
      }),
    onSuccess: async () => {
      toast.success("Attachment uploaded");
      await queryClient.invalidateQueries({
        queryKey: ["attachments", module, recordId],
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload attachment");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAttachment,
    onSuccess: async () => {
      toast.success("Attachment deleted");
      await queryClient.invalidateQueries({
        queryKey: ["attachments", module, recordId],
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete attachment");
    },
  });

  const openAttachment = async (attachment) => {
    try {
      setOpeningId(attachment.id);
      const signedUrl = await getAttachmentSignedUrl(attachment.file_path);
      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error.message || "Failed to open attachment");
    } finally {
      setOpeningId(null);
    }
  };

  const handlePickFile = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    uploadMutation.mutate({ file });
    e.target.value = "";
  };

  if (!recordId) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
        Save the record first, then upload attachments.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-slate-900">Attachments</div>
          <div className="text-xs text-slate-500">
            Upload documents, resumes, proofs, or related files.
          </div>
        </div>

        <div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button onClick={handlePickFile} disabled={uploadMutation.isPending}>
            <Upload className="h-4 w-4 mr-2" />
            {uploadMutation.isPending ? "Uploading..." : "Upload File"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-slate-500">Loading attachments...</div>
      ) : attachments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          No attachments uploaded yet.
        </div>
      ) : (
        <div className="space-y-3">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700">
                  <Paperclip className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-slate-900 truncate">
                    {attachment.file_name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {attachment.file_type || "file"} ·{" "}
                    {attachment.file_size
                      ? `${Math.round(attachment.file_size / 1024)} KB`
                      : "-"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  onClick={() => openAttachment(attachment)}
                  disabled={openingId === attachment.id}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteMutation.mutate(attachment)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}