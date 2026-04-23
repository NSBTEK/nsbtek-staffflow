const rolePermissions = {
  admin: {
    dashboard: "edit",
    jobs: "edit",
    candidates: "edit",
    submissions: "edit",
    interviews: "edit",
    placements: "edit",
    clients: "edit",
    contacts: "edit",
    activities: "edit",
    timesheets: "edit",
    expenses: "edit",
    contracts: "edit",
    onboarding: "edit",
    payroll: "edit",
    users: "edit",
    columns: "edit",
    integrations: "edit",
    ai_assistant: "edit",
    resume_parser: "edit",
    client_billing: "edit",
    request_access: "edit",
    admin_setup: "edit",
    audit_logs: "edit",
  },

  company_admin: {
    dashboard: "view",
    jobs: "edit",
    candidates: "edit",
    submissions: "edit",
    interviews: "edit",
    placements: "edit",
    clients: "edit",
    contacts: "edit",
    activities: "edit",
    timesheets: "edit",
    expenses: "edit",
    contracts: "edit",
    onboarding: "edit",
    payroll: "edit",
    users: "edit",
    columns: "edit",
    integrations: "edit",
    ai_assistant: "view",
    resume_parser: "view",
    client_billing: "edit",
    request_access: "edit",
    admin_setup: "view",
    audit_logs: "view",
  },

  hr_admin: {
    dashboard: "view",
    jobs: "none",
    candidates: "none",
    submissions: "none",
    interviews: "none",
    placements: "none",
    clients: "view",
    contacts: "view",
    activities: "view",
    timesheets: "edit",
    expenses: "edit",
    contracts: "edit",
    onboarding: "edit",
    payroll: "edit",
    users: "view",
    columns: "view",
    integrations: "none",
    ai_assistant: "none",
    resume_parser: "none",
    client_billing: "none",
    request_access: "edit",
    admin_setup: "view",
    audit_logs: "view",
  },

  workforce_manager: {
    dashboard: "view",
    jobs: "none",
    candidates: "none",
    submissions: "none",
    interviews: "none",
    placements: "none",
    clients: "none",
    contacts: "none",
    activities: "view",
    timesheets: "edit",
    expenses: "edit",
    contracts: "edit",
    onboarding: "none",
    payroll: "none",
    users: "none",
    columns: "none",
    integrations: "none",
    ai_assistant: "none",
    resume_parser: "none",
    client_billing: "none",
    request_access: "view",
    admin_setup: "none",
    audit_logs: "none",
  },

  manager: {
    dashboard: "view",
    jobs: "edit",
    candidates: "edit",
    submissions: "edit",
    interviews: "edit",
    placements: "edit",
    clients: "view",
    contacts: "view",
    activities: "edit",
    timesheets: "edit",
    expenses: "edit",
    contracts: "edit",
    onboarding: "none",
    payroll: "none",
    users: "view",
    columns: "view",
    integrations: "none",
    ai_assistant: "view",
    resume_parser: "view",
    client_billing: "none",
    request_access: "edit",
    admin_setup: "none",
    audit_logs: "none",
  },

  recruiter: {
    dashboard: "view",
    jobs: "edit",
    candidates: "edit",
    submissions: "edit",
    interviews: "edit",
    placements: "view",
    clients: "view",
    contacts: "view",
    activities: "edit",
    timesheets: "none",
    expenses: "none",
    contracts: "none",
    onboarding: "none",
    payroll: "none",
    users: "none",
    columns: "view",
    integrations: "none",
    ai_assistant: "view",
    resume_parser: "edit",
    client_billing: "none",
    request_access: "view",
    admin_setup: "none",
    audit_logs: "none",
  },

  employee: {
    dashboard: "view",
    jobs: "none",
    candidates: "none",
    submissions: "none",
    interviews: "none",
    placements: "none",
    clients: "none",
    contacts: "none",
    activities: "view_own",
    timesheets: "own",
    expenses: "own",
    contracts: "view_own",
    onboarding: "none",
    payroll: "none",
    users: "none",
    columns: "none",
    integrations: "none",
    ai_assistant: "none",
    resume_parser: "none",
    client_billing: "none",
    request_access: "own",
    admin_setup: "none",
    audit_logs: "none",
  },
};

const rank = {
  none: 0,
  view: 1,
  view_own: 2,
  own: 3,
  edit: 4,
};

function strongestLevel(a, b) {
  const aRank = rank[a] ?? 0;
  const bRank = rank[b] ?? 0;
  return bRank > aRank ? b : a;
}

export function mergeRoleGroupPermissions(roleGroupPermissions) {
  if (!roleGroupPermissions) return {};

  // If already provided as a flat map, use it directly.
  if (!Array.isArray(roleGroupPermissions)) {
    return { ...roleGroupPermissions };
  }

  // If provided as rows from multiple groups, keep strongest within role-group layer only.
  const merged = {};
  for (const row of roleGroupPermissions) {
    const moduleKey = row?.module_key;
    const level = row?.permission_level || "none";
    if (!moduleKey) continue;
    merged[moduleKey] = strongestLevel(merged[moduleKey] || "none", level);
  }
  return merged;
}

export function getEffectivePermissions(user) {
  if (!user) return {};

  const roleDefaults = rolePermissions[user.role] || {};
  const roleGroupOverrides = mergeRoleGroupPermissions(user.role_group_permissions);
  const explicitPermissions = user.permissions || {};

  const keys = new Set([
    ...Object.keys(roleDefaults),
    ...Object.keys(roleGroupOverrides),
    ...Object.keys(explicitPermissions),
  ]);

  const merged = {};

  for (const key of keys) {
    // Precedence:
    // explicit user permissions > role-group override > role default
    if (Object.prototype.hasOwnProperty.call(explicitPermissions, key)) {
      merged[key] = explicitPermissions[key];
    } else if (Object.prototype.hasOwnProperty.call(roleGroupOverrides, key)) {
      merged[key] = roleGroupOverrides[key];
    } else {
      merged[key] = roleDefaults[key] || "none";
    }
  }

  return merged;
}

export function getPermissionLevel(user, moduleKey) {
  return getEffectivePermissions(user)[moduleKey] || "none";
}

export function canView(user, moduleKey) {
  if (!user || user.status === "deactivated") return false;

  if (moduleKey === "admin_setup") {
    return (
      canView(user, "users") ||
      canView(user, "columns") ||
      canView(user, "integrations")
    );
  }

  const level = getPermissionLevel(user, moduleKey);
  return ["view", "edit", "own", "view_own"].includes(level);
}

export function canEdit(user, moduleKey) {
  if (!user || user.status === "deactivated") return false;

  const level = getPermissionLevel(user, moduleKey);
  return ["edit", "own"].includes(level);
}

export function isOwnOnly(user, moduleKey) {
  const level = getPermissionLevel(user, moduleKey);
  return ["own", "view_own"].includes(level);
}

export function canViewAll(user, moduleKey) {
  const level = getPermissionLevel(user, moduleKey);
  return ["view", "edit"].includes(level);
}

export const MODULES = {
  dashboard: "dashboard",
  jobs: "jobs",
  candidates: "candidates",
  submissions: "submissions",
  interviews: "interviews",
  placements: "placements",
  clients: "clients",
  contacts: "contacts",
  activities: "activities",
  timesheets: "timesheets",
  expenses: "expenses",
  contracts: "contracts",
  onboarding: "onboarding",
  payroll: "payroll",
  users: "users",
  columns: "columns",
  integrations: "integrations",
  ai_assistant: "ai_assistant",
  resume_parser: "resume_parser",
  client_billing: "client_billing",
  request_access: "request_access",
  admin_setup: "admin_setup",
  audit_logs: "audit_logs",
};