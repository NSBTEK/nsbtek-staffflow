export const MODULES = [
  { key: "dashboard", section: "Core", label: "Dashboard" },
  { key: "clients", section: "CRM", label: "Clients" },
  { key: "contacts", section: "CRM", label: "Contacts" },
  { key: "activities", section: "CRM", label: "Activities" },
  { key: "jobs", section: "ATS", label: "Jobs" },
  { key: "candidates", section: "ATS", label: "Candidates" },
  { key: "submissions", section: "ATS", label: "Submissions" },
  { key: "interviews", section: "ATS", label: "Interviews" },
  { key: "placements", section: "ATS", label: "Placements" },
  { key: "timesheets", section: "Workforce", label: "Timesheets" },
  { key: "expenses", section: "Workforce", label: "Expenses" },
  { key: "contracts", section: "Workforce", label: "Contracts" },
  { key: "onboarding", section: "Workforce", label: "Onboarding" },
  { key: "payroll", section: "Workforce", label: "Payroll" },
  { key: "ai_assistant", section: "AI", label: "AI Assistant" },
  { key: "resume_parser", section: "AI", label: "Resume Parser" },
  { key: "client_billing", section: "Finance", label: "Client Billing" },
  { key: "request_access", section: "Admin", label: "Request Access" },
  { key: "users", section: "Admin", label: "Users" },
  { key: "columns", section: "Admin", label: "Column Settings" },
  { key: "integrations", section: "Admin", label: "Integrations" },
  { key: "admin_setup", section: "Admin", label: "Admin Setup" },
];

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
  },
  manager: {
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
    payroll: "view",
    users: "view",
    columns: "view",
    integrations: "view",
    ai_assistant: "view",
    resume_parser: "edit",
    client_billing: "view",
    request_access: "edit",
    admin_setup: "view",
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
    contracts: "view",
    onboarding: "view",
    payroll: "none",
    users: "none",
    columns: "view",
    integrations: "none",
    ai_assistant: "view",
    resume_parser: "edit",
    client_billing: "none",
    request_access: "view",
    admin_setup: "none",
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
    onboarding: "view_own",
    payroll: "view_own",
    users: "none",
    columns: "none",
    integrations: "none",
    ai_assistant: "none",
    resume_parser: "none",
    client_billing: "none",
    request_access: "own",
    admin_setup: "none",
  },
};

export function getEffectivePermissions(user) {
  if (!user) return {};
  const roleDefaults = rolePermissions[user.role] || {};
  const roleGroupPermissions = user.role_group_permissions || {};
  const explicitPermissions = user.permissions || {};
  return { ...roleDefaults, ...roleGroupPermissions, ...explicitPermissions };
}

export function getPermissionLevel(user, module) {
  const permissions = getEffectivePermissions(user);
  return permissions[module] || "none";
}

export function canView(user, module) {
  if (!user || user.status === "deactivated") return false;
  if (user.role === "admin") return true;

  if (module === "admin_setup") {
    return canView(user, "users") || canView(user, "columns") || canView(user, "integrations");
  }

  const level = getPermissionLevel(user, module);
  return ["view", "edit", "own", "view_own"].includes(level);
}

export function canEdit(user, module) {
  if (!user || user.status === "deactivated") return false;
  if (user.role === "admin") return true;
  const level = getPermissionLevel(user, module);
  return ["edit", "own"].includes(level);
}

export function isOwnOnly(user, module) {
  const level = getPermissionLevel(user, module);
  return ["own", "view_own"].includes(level);
}

export function canViewAll(user, module) {
  const level = getPermissionLevel(user, module);
  return ["view", "edit"].includes(level);
}