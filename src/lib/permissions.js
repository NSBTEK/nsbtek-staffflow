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
    payroll: "edit",
    ai_assistant: "edit",
    resume_parser: "edit",
    client_billing: "edit",
    request_access: "edit",
  },
  recruiter: {
    dashboard: "view",
    jobs: "edit",
    candidates: "edit",
    submissions: "edit",
    interviews: "edit",
    placements: "edit",
    request_access: "edit",
  },
  sales: {
    dashboard: "view",
    clients: "edit",
    contacts: "edit",
    activities: "edit",
    client_billing: "edit",
    request_access: "edit",
  },
  workforce_manager: {
    dashboard: "view",
    placements: "view",
    timesheets: "edit",
    expenses: "edit",
    contracts: "edit",
    onboarding: "edit",
    payroll: "edit",
    request_access: "edit",
  },
  employee: {
    dashboard: "view",
    timesheets: "own",
    expenses: "own",
    contracts: "view_own",
    onboarding: "view_own",
    payroll: "view_own",
    request_access: "edit",
  },
  viewer: {
    dashboard: "view",
    jobs: "view",
    candidates: "view",
    submissions: "view",
    interviews: "view",
    placements: "view",
    clients: "view",
    contacts: "view",
    activities: "view",
    timesheets: "view",
    expenses: "view",
    contracts: "view",
    onboarding: "view",
    payroll: "view",
    ai_assistant: "view",
    resume_parser: "view",
    client_billing: "view",
    request_access: "edit",
  },
};

export const ROLE_DEFAULTS = rolePermissions;

export const MODULES = [
  { key: "dashboard", label: "Dashboard", section: "Overview" },

  { key: "clients", label: "Clients", section: "CRM" },
  { key: "contacts", label: "Contacts", section: "CRM" },
  { key: "activities", label: "Activities", section: "CRM" },

  { key: "jobs", label: "Jobs", section: "ATS" },
  { key: "candidates", label: "Candidates", section: "ATS" },
  { key: "submissions", label: "Submissions", section: "ATS" },
  { key: "interviews", label: "Interviews", section: "ATS" },
  { key: "placements", label: "Placements", section: "ATS" },

  { key: "request_access", label: "Request Access", section: "HR" },

  { key: "timesheets", label: "Timesheets", section: "Workforce" },
  { key: "expenses", label: "Expenses", section: "Workforce" },
  { key: "contracts", label: "Contracts", section: "Workforce" },
  { key: "onboarding", label: "Onboarding", section: "Workforce" },
  { key: "payroll", label: "Payroll", section: "Workforce" },

  { key: "ai_assistant", label: "AI Assistant", section: "AI" },
  { key: "resume_parser", label: "Resume Parser", section: "AI" },
  { key: "client_billing", label: "Client Billing", section: "AI" },

  { key: "users", label: "Users", section: "Admin Setup" },
  { key: "columns", label: "Columns", section: "Admin Setup" },
  { key: "integrations", label: "Integrations", section: "Admin Setup" },
  { key: "admin_setup", label: "Admin Setup", section: "Admin Setup" },
];

export const ROLES = [
  { value: "admin", label: "Admin", desc: "Full access to everything" },
  { value: "manager", label: "Manager", desc: "Full ATS + CRM + Workforce" },
  { value: "recruiter", label: "Recruiter", desc: "ATS modules only" },
  { value: "sales", label: "Sales", desc: "CRM modules only" },
  { value: "workforce_manager", label: "Workforce Manager", desc: "Workforce + Placements" },
  { value: "employee", label: "Employee", desc: "Own workforce tools only" },
  { value: "viewer", label: "Viewer", desc: "Read-only access" },
];

export function getEffectivePermissions(user) {
  if (!user) return {};

  const roleDefaults = rolePermissions[user.role] || {};
  const moduleAccess = user.module_access || {};
  const explicitPermissions = user.permissions || {};

  const normalizedModuleAccess = Object.fromEntries(
    Object.entries(moduleAccess).map(([key, value]) => {
      if (value === true) return [key, "edit"];
      if (value === false) return [key, "none"];
      return [key, value];
    })
  );

  return {
    ...roleDefaults,
    ...normalizedModuleAccess,
    ...explicitPermissions,
  };
}

export function canView(user, module) {
  if (!user) return false;
  if (user.status === "deactivated") return false;

  if (user.role === "admin") return true;

  if (module === "admin_setup") {
    return canView(user, "users") || canView(user, "columns") || canView(user, "integrations");
  }

  const p = getEffectivePermissions(user);
  return ["view", "edit", "own", "view_own"].includes(p[module]);
}

export function canEdit(user, module) {
  if (!user) return false;
  if (user.status === "deactivated") return false;

  if (user.role === "admin") return true;

  const p = getEffectivePermissions(user);
  return p[module] === "edit" || p[module] === "own";
}

export function isOwnOnly(user, module) {
  if (!user) return false;
  const p = getEffectivePermissions(user);
  return p[module] === "own" || p[module] === "view_own";
}

export function canViewAll(user, module) {
  if (!user) return false;
  return !isOwnOnly(user, module) && canView(user, module);
}

export function isDeactivated(user) {
  return user?.status === "deactivated";
}