import * as jobsApi from "@/api/jobs";

export async function loadJobs() {
  return jobsApi.listJobs();
}

export async function saveJob(input) {
  if (input.id) {
    return jobsApi.updateJob(input.id, input);
  }
  return jobsApi.createJob(input);
}

export async function removeJob(id) {
  return jobsApi.deleteJob(id);
}
