import {
  listScopedRows,
  createScopedRow,
  updateScopedRow,
  deleteScopedRow,
} from "@/lib/scopedQuery";

const TABLE = "candidates";

const ALLOWED_KEYS = [
  "first_name",
  "last_name",
  "full_name",
  "email",
  "phone",
  "status",
  "title",
  "location",
  "experience",
  "skills",
  "notes",
  "source",
  "resume_url",
];

export function listCandidates(currentUser) {
  return listScopedRows({
    table: TABLE,
    currentUser,
  });
}

export function createCandidate(payload, currentUser) {
  return createScopedRow({
    table: TABLE,
    currentUser,
    payload,
    allowedKeys: ALLOWED_KEYS,
  });
}

export function updateCandidate(id, payload, currentUser) {
  return updateScopedRow({
    table: TABLE,
    id,
    currentUser,
    payload,
    allowedKeys: ALLOWED_KEYS,
  });
}

export function deleteCandidate(id) {
  return deleteScopedRow({
    table: TABLE,
    id,
  });
}