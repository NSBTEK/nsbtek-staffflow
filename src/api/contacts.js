import {
  listScopedRows,
  createScopedRow,
  updateScopedRow,
  deleteScopedRow,
} from "@/lib/scopedQuery";

const TABLE = "contacts";

const ALLOWED_KEYS = [
  "first_name",
  "last_name",
  "full_name",
  "email",
  "phone",
  "title",
  "client_name",
  "status",
  "notes",
];

export function listContacts(currentUser) {
  return listScopedRows({
    table: TABLE,
    currentUser,
  });
}

export function createContact(payload, currentUser) {
  return createScopedRow({
    table: TABLE,
    currentUser,
    payload,
    allowedKeys: ALLOWED_KEYS,
  });
}

export function updateContact(id, payload, currentUser) {
  return updateScopedRow({
    table: TABLE,
    id,
    currentUser,
    payload,
    allowedKeys: ALLOWED_KEYS,
  });
}

export function deleteContact(id) {
  return deleteScopedRow({
    table: TABLE,
    id,
  });
}