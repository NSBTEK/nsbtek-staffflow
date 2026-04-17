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

  if (!canEdit(user, module)) return false;
  if (canViewAll(user, module)) return true;
  if (isOwnOnly(user, module)) {
    return record?.[ownerColumn] === user?.id;
  }
  return false;
}