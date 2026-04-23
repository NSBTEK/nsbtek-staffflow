import {
  LayoutDashboard,
  Handshake,
  Users,
  Activity,
  Briefcase,
  UserRound,
  Send,
  CalendarClock,
  BadgeCheck,
  Sparkles,
  FileSearch,
  CreditCard,
  Shield,
  Clock3,
  Receipt,
  FileText,
  ClipboardCheck,
  Wallet,
  Columns3,
  UserCog,
  Layers3,
  PlugZap,
  Database,
  KeyRound,
} from "lucide-react";

export const pageHeroConfig = {
  "/dashboard": {
    eyebrow: "Overview",
    title: "Dashboard",
    description:
      "Monitor recruiting, workforce, finance, and operational activity with a centralized overview.",
    icon: LayoutDashboard,
  },
  "/clients": {
    eyebrow: "CRM",
    title: "Clients",
    description:
      "Manage client companies, account relationships, and recruitment-facing business context.",
    icon: Handshake,
  },
  "/contacts": {
    eyebrow: "CRM",
    title: "Contacts",
    description:
      "Track client and internal contacts, roles, communication details, and ownership relationships.",
    icon: Users,
  },
  "/activities": {
    eyebrow: "CRM",
    title: "Activities",
    description:
      "Track tasks, notes, calls, meetings, and operational activity timelines across your workflows.",
    icon: Activity,
  },
  "/jobs": {
    eyebrow: "Recruiting Pipeline",
    title: "Jobs",
    description:
      "Create and manage job openings, statuses, assignment context, and hiring progress.",
    icon: Briefcase,
  },
  "/candidates": {
    eyebrow: "Recruiting Pipeline",
    title: "Candidates",
    description:
      "Manage candidate records, resumes, profiles, statuses, and recruiting movement across jobs.",
    icon: UserRound,
  },
  "/submissions": {
    eyebrow: "Recruiting Pipeline",
    title: "Submissions",
    description:
      "Track candidate submissions to jobs, submission outcomes, and pipeline movement across clients and recruiters.",
    icon: Send,
  },
  "/interviews": {
    eyebrow: "Hiring Coordination",
    title: "Interviews",
    description:
      "Organize interview schedules, interview status, candidate progress, and coordination activity across stakeholders.",
    icon: CalendarClock,
  },
  "/placements": {
    eyebrow: "Hiring Outcomes",
    title: "Placements",
    description:
      "Track successful placements, placement details, revenue-related milestones, and post-offer staffing outcomes.",
    icon: BadgeCheck,
  },
  "/ai-assistant": {
    eyebrow: "AI Workspace",
    title: "AI Assistant",
    description:
      "Use AI to support recruiting, workforce operations, document understanding, drafting, and intelligent workflow assistance.",
    icon: Sparkles,
  },
  "/resume-parser": {
    eyebrow: "AI Extraction",
    title: "Resume Parser",
    description:
      "Upload resumes or documents, extract structured details, and populate candidates or jobs with parsed information.",
    icon: FileSearch,
  },
  "/client-billing": {
    eyebrow: "Finance Operations",
    title: "Client Billing",
    description:
      "Track client invoices, billing-related records, and revenue-side financial workflows for your organization.",
    icon: CreditCard,
  },
  "/request-access": {
    eyebrow: "Security Access",
    title: "Request Access",
    description:
      "Submit module access requests and review access approvals across your organization’s security model.",
    icon: Shield,
  },
  "/timesheets": {
    eyebrow: "Workforce Tracking",
    title: "Timesheets",
    description:
      "Track workforce hours, submission status, review cycles, and supporting timesheet attachments.",
    icon: Clock3,
  },
  "/expenses": {
    eyebrow: "Workforce Costs",
    title: "Expenses",
    description:
      "Manage workforce expenses, reimbursements, supporting documents, and approval-ready cost tracking.",
    icon: Receipt,
  },
  "/contracts": {
    eyebrow: "Workforce Documentation",
    title: "Contracts",
    description:
      "Manage contracts, agreement details, status tracking, and workforce documentation securely.",
    icon: FileText,
  },
  "/onboarding": {
    eyebrow: "Workforce Setup",
    title: "Onboarding",
    description:
      "Track onboarding progress, required steps, employee readiness, and operational completion across new hires.",
    icon: ClipboardCheck,
  },
  "/payroll": {
    eyebrow: "Payroll Operations",
    title: "Payroll",
    description:
      "Manage payroll runs, payroll preparation, provider sync workflows, and workforce pay operations.",
    icon: Wallet,
  },
  "/admin/column-settings": {
    eyebrow: "Configuration",
    title: "Column Settings",
    description:
      "Configure table columns, form fields, visibility, and module-level field behavior across the application.",
    icon: Columns3,
  },
  "/admin/users": {
    eyebrow: "Security Access",
    title: "User Management",
    description:
      "Invite users, assign roles, set managers, and maintain access across your organization.",
    icon: UserCog,
  },
  "/admin/role-groups": {
    eyebrow: "Security Access",
    title: "Role Groups",
    description:
      "Create organization-specific role groups, control module access, and assign users to the correct group.",
    icon: Layers3,
  },
  "/admin/integrations": {
    eyebrow: "Connectivity",
    title: "Integrations",
    description:
      "Manage provider connections, sync settings, connection status, and external platform linking.",
    icon: PlugZap,
  },
  "/admin/external-applicants": {
    eyebrow: "Connectivity",
    title: "External Applicants",
    description:
      "Review applicants received from external systems and manage intake into your hiring workflows.",
    icon: Database,
  },
  "/admin/external-jobs": {
    eyebrow: "Connectivity",
    title: "External Jobs",
    description:
      "Review jobs synced from external systems and manage connected external job records.",
    icon: Database,
  },
  "/admin/request-access": {
    eyebrow: "Security Access",
    title: "Access Requests",
    description:
      "Review submitted access requests and maintain governance over user permissions.",
    icon: KeyRound,
  },
  "/admin/audit-logs": {
    eyebrow: "Governance",
    title: "Audit Logs",
    description:
      "Review application actions, administrative changes, and security-relevant activity history.",
    icon: Shield,
  },
};