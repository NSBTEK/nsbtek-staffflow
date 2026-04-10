import {
  listScopedRows,
  createScopedRow,
  updateScopedRow,
  deleteScopedRow,
} from "@/lib/scopedQuery";

const TABLE = "clients";

const ALLOWED_KEYS = [
  "name",
  "company_name",
  "status",
  "industry",
  "website",
  "phone",
  "email",
  "address",
  "city",
  "state",
  "country",
  "notes",
];

export function listClients(currentUser) {
  return listScopedRows({
    table: TABLE,
    currentUser,
  });
}

export function createClient(payload, currentUser) {
  return createScopedRow({
    table: TABLE,
    currentUser,
    payload,
    allowedKeys: ALLOWED_KEYS,
  });
}

export function updateClient(id, payload, currentUser) {
  return updateScopedRow({
    table: TABLE,
    id,
    currentUser,
    payload,
    allowedKeys: ALLOWED_KEYS,
  });
}

export function deleteClient(id) {
  return deleteScopedRow({
    table: TABLE,
    id,
  });
}