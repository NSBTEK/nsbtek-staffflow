import {
  listScopedRows,
  createScopedRow,
  updateScopedRow,
  deleteScopedRow,
} from "@/lib/scopedQuery";

const TABLE = "jobs";

const ALLOWED_KEYS = [
  "title",
  "job_title",
  "client_name",
  "description",
  "status",
  "location",
  "employment_type",
  "department",
  "priority",
  "openings",
  "salary_min",
  "salary_max",
  "start_date",
  "notes",
];

export function listJobs(currentUser) {
  return listScopedRows({
    table: TABLE,
    currentUser,
  });
}

export function createJob(payload, currentUser) {
  return createScopedRow({
    table: TABLE,
    currentUser,
    payload,
    allowedKeys: ALLOWED_KEYS,
  });
}

export function updateJob(id, payload, currentUser) {
  return updateScopedRow({
    table: TABLE,
    id,
    currentUser,
    payload,
    allowedKeys: ALLOWED_KEYS,
  });
}

export function deleteJob(id) {
  return deleteScopedRow({
    table: TABLE,
    id,
  });
}