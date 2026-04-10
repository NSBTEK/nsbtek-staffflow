import {
  listScopedRows,
  createScopedRow,
  updateScopedRow,
  deleteScopedRow,
} from "@/lib/scopedQuery";

const TABLE = "activities";

const ALLOWED_KEYS = [
  "title",
  "subject",
  "activity_type",
  "status",
  "description",
  "related_to",
  "related_id",
  "scheduled_at",
  "completed_at",
  "notes",
];

export function listActivities(currentUser) {
  return listScopedRows({
    table: TABLE,
    currentUser,
  });
}

export function createActivity(payload, currentUser) {
  return createScopedRow({
    table: TABLE,
    currentUser,
    payload,
    allowedKeys: ALLOWED_KEYS,
  });
}

export function updateActivity(id, payload, currentUser) {
  return updateScopedRow({
    table: TABLE,
    id,
    currentUser,
    payload,
    allowedKeys: ALLOWED_KEYS,
  });
}

export function deleteActivity(id) {
  return deleteScopedRow({
    table: TABLE,
    id,
  });
}