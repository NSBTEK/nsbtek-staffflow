import React, { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import SearchableEntitySelect from "@/components/shared/SearchableEntitySelect";
import { toast } from "sonner";

export default function JobPipelineCandidateLink({
  candidates = [],
  onTagCandidate,
  buttonLabel = "Tag Candidate",
  disabled = false,
}) {
  const [candidateId, setCandidateId] = useState("");

  const candidateOptions = useMemo(() => {
    return candidates.map((candidate) => ({
      value: candidate.id,
      label:
        [candidate.first_name, candidate.last_name].filter(Boolean).join(" ").trim() ||
        "Unnamed Candidate",
      description: [candidate.email, candidate.phone, candidate.current_title]
        .filter(Boolean)
        .join(" • "),
      keywords: [
        candidate.first_name,
        candidate.last_name,
        candidate.email,
        candidate.phone,
        candidate.current_title,
      ]
        .filter(Boolean)
        .join(" "),
    }));
  }, [candidates]);

  const tagMutation = useMutation({
    mutationFn: async () => {
      if (!candidateId) throw new Error("Please select a candidate");
      return onTagCandidate(candidateId);
    },
    onSuccess: () => {
      toast.success("Candidate tagged successfully");
      setCandidateId("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to tag candidate");
    },
  });

  return (
    <div className="rounded-2xl border bg-card p-4 space-y-3">
      <div>
        <h3 className="text-sm font-semibold">Link Candidate to Job Pipeline</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Start typing the candidate’s first few letters to quickly select and tag.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <SearchableEntitySelect
            label=""
            value={candidateId}
            onChange={setCandidateId}
            options={candidateOptions}
            placeholder="Type candidate name..."
            emptyText="No candidates found"
            disabled={disabled || tagMutation.isPending}
          />
        </div>

        <button
          type="button"
          onClick={() => tagMutation.mutate()}
          disabled={disabled || tagMutation.isPending || !candidateId}
          className="rounded-xl bg-blue-600 text-white px-4 py-2 font-medium disabled:opacity-50"
        >
          {tagMutation.isPending ? "Tagging..." : buttonLabel}
        </button>
      </div>
    </div>
  );
}