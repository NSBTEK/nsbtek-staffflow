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

  const { error } = await supabase.from("job_candidates").insert({
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

export async function unlinkCandidateFromJob(linkId) {
  const { data: linkRow, error: getError } = await supabase
    .from("job_candidates")
    .select("*")
    .eq("id", linkId)
    .single();

  if (getError) throw getError;

  const { error } = await supabase.from("job_candidates").delete().eq("id", linkId);
  if (error) throw error;

  await syncPipelineSummaries(linkRow.job_id, linkRow.candidate_id);
  return true;
}

export async function syncPipelineSummaries(jobId, candidateId) {
  if (candidateId) {
    const { data: candidateLinks, error: candidateLinksError } = await supabase
      .from("job_candidates")
      .select("stage")
      .eq("candidate_id", candidateId);

    if (candidateLinksError) throw candidateLinksError;

    const candidateStage = getCandidateStageFromPipeline(candidateLinks || []);

    const { error: candidateUpdateError } = await supabase
      .from("candidates")
      .update({
        status: candidateStage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", candidateId);

    if (candidateUpdateError) throw candidateUpdateError;
  }

  if (jobId) {
    const { data: jobLinks, error: jobLinksError } = await supabase
      .from("job_candidates")
      .select("stage")
      .eq("job_id", jobId);

    if (jobLinksError) throw jobLinksError;

    const jobStage = getJobStageFromPipeline(jobLinks || []);

    const { error: jobUpdateError } = await supabase
      .from("jobs")
      .update({
        pipeline_status: jobStage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (jobUpdateError) throw jobUpdateError;
  }
}