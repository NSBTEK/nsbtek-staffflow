import { supabase } from "@/lib/supabaseClient";
import { getProfileOrThrow } from "@/lib/profile";
import { getCandidateStageFromPipeline, getJobStageFromPipeline } from "@/lib/statusEngine";

export async function listJobPipeline(currentUser, jobId) {
  const profile = await getProfileOrThrow(currentUser.id);
  const { data, error } = await supabase
    .from("job_candidates")
    .select(`
      *,
      candidates (*)
    `)
    .eq("organization_id", profile.organization_id)
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function linkCandidateToJob(currentUser, { job_id, candidate_id }) {
  const profile = await getProfileOrThrow(currentUser.id);
  const { error } = await supabase
    .from("job_candidates")
    .insert({
      organization_id: profile.organization_id,
      job_id,
      candidate_id,
      stage: "tagged",
      created_by: currentUser.id,
      updated_by: currentUser.id,
    });
  if (error) throw error;
  await syncPipelineSummaries(job_id, candidate_id);
  return true;
}

export async function updatePipelineStage(currentUser, linkId, stage) {
  const { data: linkRow, error: getError } = await supabase
    .from("job_candidates")
    .select("*")
    .eq("id", linkId)
    .single();
  if (getError) throw getError;

  const { error } = await supabase
    .from("job_candidates")
    .update({
      stage,
      updated_by: currentUser.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", linkId);
  if (error) throw error;

  await syncPipelineSummaries(linkRow.job_id, linkRow.candidate_id);
  return true;
}

async function syncPipelineSummaries(jobId, candidateId) {
  const { data: jobRows, error: rowsError } = await supabase
    .from("job_candidates")
    .select("*")
    .eq("job_id", jobId);
  if (rowsError) throw rowsError;

  const candidateRows = (jobRows || []).filter((row) => row.candidate_id === candidateId);
  const latestCandidateStage = candidateRows[0]?.stage || "tagged";
  const nextCandidateStatus = getCandidateStageFromPipeline({ stage: latestCandidateStage });
  const nextJobStatus = getJobStageFromPipeline(jobRows || []);

  const { error: candidateError } = await supabase
    .from("candidates")
    .update({ status: nextCandidateStatus, updated_at: new Date().toISOString() })
    .eq("id", candidateId);
  if (candidateError) throw candidateError;

  const { error: jobError } = await supabase
    .from("jobs")
    .update({ status: nextJobStatus, updated_at: new Date().toISOString() })
    .eq("id", jobId);
  if (jobError) throw jobError;
}
Create src/components/jobs/JobPipelinePanel.jsx
import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listJobPipeline, linkCandidateToJob, updatePipelineStage } from "@/api/pipeline";
import { supabase } from "@/lib/supabaseClient";

async function listCandidates() {
  const { data, error } = await supabase
    .from("candidates")
    .select("id, first_name, last_name, email")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

const STAGES = ["tagged", "submitted", "interview", "offered", "placed", "rejected"];

export default function JobPipelinePanel({ jobId }) {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();
  const [candidateId, setCandidateId] = useState("");

  const { data: rows = [] } = useQuery({
    queryKey: ["job-pipeline", jobId],
    queryFn: () => listJobPipeline(authUser, jobId),
    enabled: !!authUser?.id && !!jobId,
  });

  const { data: candidates = [] } = useQuery({ queryKey: ["pipeline-candidates"], queryFn: listCandidates });

  const linkMutation = useMutation({
    mutationFn: (payload) => linkCandidateToJob(authUser, payload),
    onSuccess: () => {
      setCandidateId("");
      queryClient.invalidateQueries({ queryKey: ["job-pipeline", jobId] });
    },
  });

  const stageMutation = useMutation({
    mutationFn: ({ linkId, stage }) => updatePipelineStage(authUser, linkId, stage),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["job-pipeline", jobId] }),
  });

  return (
    <div className="rounded-2xl border bg-card p-5 space-y-4">
      <h3 className="text-lg font-semibold">Job Pipeline</h3>

      <div className="flex flex-col md:flex-row gap-3">
        <select value={candidateId} onChange={(e) => setCandidateId(e.target.value)} className="flex-1 rounded-lg border px-3 py-2">
          <option value="">Select candidate</option>
          {candidates.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.first_name} {candidate.last_name} {candidate.email ? `— ${candidate.email}` : ""}
            </option>
          ))}
        </select>
        <button onClick={() => candidateId && linkMutation.mutate({ job_id: jobId, candidate_id: candidateId })} className="rounded-xl bg-blue-600 text-white px-4 py-2 font-medium">
          Tag Candidate
        </button>
      </div>

      <div className="space-y-3">
        {rows.length === 0 ? (
          <div className="text-muted-foreground">No candidates linked yet.</div>
        ) : (
          rows.map((row) => (
            <div key={row.id} className="rounded-xl border p-4 space-y-2">
              <div className="font-medium">{row.candidates?.first_name} {row.candidates?.last_name}</div>
              <div className="text-sm text-muted-foreground">Current stage: {row.stage}</div>
              <div className="flex flex-wrap gap-2 pt-1">
                {STAGES.map((stage) => (
                  <button key={stage} onClick={() => stageMutation.mutate({ linkId: row.id, stage })} className={`rounded-lg border px-3 py-1.5 text-sm ${row.stage === stage ? "bg-blue-600 text-white border-blue-600" : ""}`}>
                    {stage}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
