const rank = {
  none: 0,
  view: 1,
  view_own: 2,
  own: 3,
  edit: 4,
};

function getPermission(user, moduleKey) {
  return user?.role_group_permissions?.[moduleKey] || "none";
}

export function canView(user, moduleKey) {
  return rank[getPermission(user, moduleKey)] >= rank.view;
}

export function canEdit(user, moduleKey) {
  return rank[getPermission(user, moduleKey)] >= rank.edit;
}

export function isOwnOnly(user, moduleKey) {
  const permission = getPermission(user, moduleKey);
  return permission === "view_own" || permission === "own";
}

export function canViewAll(user, moduleKey) {
  const permission = getPermission(user, moduleKey);
  return permission === "view" || permission === "edit";
}
