import { canEdit, canViewAll, isOwnOnly } from "@/lib/permissions";

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

  let scoped = query.eq(orgColumn, organizationId);

  if (isOwnOnly(user, module)) {
    scoped = scoped.eq(ownerColumn, userId);
  }

  return scoped;
}

export function canSeeAllRows(user, module) {
  return canViewAll(user, module);
}
