import * as candidatesApi from "@/api/candidates";

export async function loadCandidates() {
  return candidatesApi.listCandidates();
}

export async function saveCandidate(input) {
  if (input.id) {
    return candidatesApi.updateCandidate(input.id, input);
  }
  return candidatesApi.createCandidate(input);
}
