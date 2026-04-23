import { ROUTES } from "@/config/routes";
import { MODULES } from "@/config/modules";

export const navigation = [
  {
    label: "Dashboard",
    items: [{ label: "Overview", to: ROUTES.dashboard, moduleKey: MODULES.dashboard }],
  },
  {
    label: "CRM",
    items: [
      { label: "Clients", to: ROUTES.clients, moduleKey: MODULES.crm },
      { label: "Contacts", to: ROUTES.contacts, moduleKey: MODULES.contacts },
    ],
  },
  {
    label: "ATS",
    items: [
      { label: "Jobs", to: ROUTES.jobs, moduleKey: MODULES.jobs },
      { label: "Candidates", to: ROUTES.candidates, moduleKey: MODULES.candidates },
      { label: "Submissions", to: ROUTES.submissions, moduleKey: MODULES.submissions },
      { label: "Placements", to: ROUTES.placements, moduleKey: MODULES.placements },
    ],
  },
  {
    label: "Workforce",
    items: [
      { label: "Contracts", to: ROUTES.contracts, moduleKey: MODULES.contracts },
      { label: "Expenses", to: ROUTES.expenses, moduleKey: MODULES.expenses },
      { label: "Onboarding", to: ROUTES.onboarding, moduleKey: MODULES.onboarding },
      { label: "Payroll", to: ROUTES.payroll, moduleKey: MODULES.payroll },
      { label: "Timesheets", to: ROUTES.timesheets, moduleKey: MODULES.timesheets },
    ],
  },
  {
    label: "Admin",
    items: [
      { label: "Users", to: ROUTES.users, moduleKey: MODULES.users },
      { label: "Integrations", to: ROUTES.integrations, moduleKey: MODULES.integrations },
      { label: "Audit Logs", to: ROUTES.auditLogs, moduleKey: MODULES.audit_logs },
    ],
  },
];
