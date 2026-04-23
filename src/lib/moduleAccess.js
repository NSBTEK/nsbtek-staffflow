import { canEdit, canView, canViewAll, isOwnOnly } from "@/lib/permissions";

export function assertCanViewModule(user, module) {
  if (!canView(user, module)) {
    throw new Error(`You do not have access to ${module}`);
  }
}

export function assertCanEditModule(user, module) {
  if (!canEdit(user, module)) {
    throw new Error(`You do not have edit access to ${module}`);
  }
}

export function buildScopedListQuery(query, user, module, options = {}) {
  const {
    ownerColumn = "created_by",
    orgColumn = "organization_id",
    userId = user?.id,
    organizationId = user?.organization_id,
  } = options;

  assertCanViewModule(user, module);

  let scoped = query.eq(orgColumn, organizationId);

  if (isOwnOnly(user, module)) {
    scoped = scoped.eq(ownerColumn, userId);
  }

  return scoped;
}

export function buildScopedWriteQuery(query, user, module, options = {}) {
  const {
    ownerColumn = "created_by",
    orgColumn = "organization_id",
    userId = user?.id,
    organizationId = user?.organization_id,
  } = options;

  assertCanEditModule(user, module);

  let scoped = query.eq(orgColumn, organizationId);

  if (isOwnOnly(user, module)) {
    scoped = scoped.eq(ownerColumn, userId);
  }

  return scoped;
}

export function canEditRecord(user, module, record, options = {}) {
  const ownerColumn = options.ownerColumn || "created_by";
  const orgColumn = options.orgColumn || "organization_id";

  if (!record || !user) return false;
  if (!canEdit(user, module)) return false;
  if (record[orgColumn] !== user.organization_id) return false;

  if (isOwnOnly(user, module)) {
    return record[ownerColumn] === user.id;
  }

  return true;
}

export function canViewRecord(user, module, record, options = {}) {
  const ownerColumn = options.ownerColumn || "created_by";
  const orgColumn = options.orgColumn || "organization_id";

  if (!record || !user) return false;
  if (!canView(user, module)) return false;
  if (record[orgColumn] !== user.organization_id) return false;

  if (isOwnOnly(user, module)) {
    return record[ownerColumn] === user.id;
  }

  return true;
}

export function scopeRowsForUser(rows, user, module, options = {}) {
  const ownerColumn = options.ownerColumn || "created_by";
  const orgColumn = options.orgColumn || "organization_id";

  if (!Array.isArray(rows) || !user) return [];
  if (!canView(user, module)) return [];

  const sameOrgRows = rows.filter((row) => row?.[orgColumn] === user.organization_id);

  if (canViewAll(user, module)) {
    return sameOrgRows;
  }

  if (isOwnOnly(user, module)) {
    return sameOrgRows.filter((row) => row?.[ownerColumn] === user.id);
  }

  return sameOrgRows;
}