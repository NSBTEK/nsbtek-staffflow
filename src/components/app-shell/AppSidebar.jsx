import { useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  UserRound,
  FileStack,
  Handshake,
  CalendarClock,
  Clock3,
  Receipt,
  FileText,
  BadgeDollarSign,
  Shield,
  Settings2,
  Database,
  Bot,
  FileSearch,
  CreditCard,
  KeyRound,
  Building2,
  Activity,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import logo from "@/assets/logo.png";
import { useProfile } from "@/hooks/useProfile";
import { canView } from "@/lib/permissions";

const navigationSections = [
  {
    key: "overview",
    label: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard", module: "dashboard" },
    ],
  },
  {
    key: "recruitment",
    label: "Recruitment",
    items: [
      { icon: Handshake, label: "Clients", to: "/clients", module: "clients", description: "Manage client companies and account relationships." },
      { icon: Users, label: "Contacts", to: "/contacts", module: "contacts", description: "Track client and candidate contacts." },
      { icon: Activity, label: "Activities", to: "/activities", module: "activities", description: "View tasks, calls, notes, and activity timelines." },
      { icon: Briefcase, label: "Jobs", to: "/jobs", module: "jobs", description: "Create and manage job openings." },
      { icon: UserRound, label: "Candidates", to: "/candidates", module: "candidates", description: "Manage candidate records and progress." },
      { icon: FileStack, label: "Submissions", to: "/submissions", module: "submissions", description: "Track candidate submissions to clients." },
      { icon: CalendarClock, label: "Interviews", to: "/interviews", module: "interviews", description: "Schedule and manage interviews." },
      { icon: Building2, label: "Placements", to: "/placements", module: "placements", description: "Track confirmed placements and starts." },
    ],
  },
  {
    key: "productivity",
    label: "Productivity",
    items: [
      { icon: Bot, label: "AI Assistant", to: "/ai-assistant", module: "ai_assistant", description: "Use AI tools for drafting and workflow help." },
      { icon: FileSearch, label: "Resume Parser", to: "/resume-parser", module: "resume_parser", description: "Upload and parse resumes into structured data." },
      { icon: CreditCard, label: "Client Billing", to: "/client-billing", module: "client_billing", description: "Manage billing and client charges." },
      { icon: KeyRound, label: "Request Access", to: "/request-access", module: "request_access", description: "Submit and track access requests." },
    ],
  },
  {
    key: "workforce",
    label: "Workforce",
    items: [
      { icon: Clock3, label: "Timesheets", to: "/timesheets", module: "timesheets", description: "Track employee and contractor timesheets." },
      { icon: Receipt, label: "Expenses", to: "/expenses", module: "expenses", description: "Manage submitted expense records." },
      { icon: FileText, label: "Contracts", to: "/contracts", module: "contracts", description: "Store and manage workforce contracts." },
      { icon: Users, label: "Onboarding", to: "/onboarding", module: "onboarding", description: "Manage new hire onboarding tasks and status." },
      { icon: BadgeDollarSign, label: "Payroll", to: "/payroll", module: "payroll", description: "Run payroll sync and manage payroll workflows." },
    ],
  },
  {
    key: "admin",
    label: "Admin",
    items: [
      { icon: Settings2, label: "Column Settings", to: "/admin/column-settings", module: "columns", description: "Configure table columns and defaults." },
      { icon: Shield, label: "User Management", to: "/admin/users", module: "users", description: "Invite users, update roles, and manage access." },
      { icon: Shield, label: "Role Groups", to: "/admin/role-groups", module: "users", description: "Manage reusable permission groups." },
      { icon: Database, label: "Integrations", to: "/admin/integrations", module: "integrations", description: "Connect external systems and providers." },
      { icon: Database, label: "External Applicants", to: "/admin/external-applicants", module: "integrations", description: "Review synced external applicants." },
      { icon: Briefcase, label: "External Jobs", to: "/admin/external-jobs", module: "integrations", description: "Review synced external job postings." },
      { icon: Settings2, label: "Audit Logs", to: "/admin/audit-logs", module: "audit_logs", description: "Review system actions and changes." },
      { icon: KeyRound, label: "Access Requests", to: "/admin/request-access", module: "request_access", description: "Approve or review access requests." },
    ],
  },
];

function itemClass({ isActive }) {
  return [
    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
    isActive
      ? "bg-indigo-600 text-white"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  ].join(" ");
}

export default function AppSidebar() {
  const { profile } = useProfile();
  const location = useLocation();

  const visibleSections = useMemo(() => {
    return navigationSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          item.module ? canView(profile, item.module) : true
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [profile]);

  const defaultExpanded = useMemo(() => {
    const next = {};
    for (const section of visibleSections) {
      next[section.key] = section.items.some((item) =>
        location.pathname.startsWith(item.to)
      );
    }
    return next;
  }, [visibleSections, location.pathname]);

  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggleSection = (key) => {
    setExpanded((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <aside className="flex h-screen w-[290px] shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="NSBTEK Logo"
            className="h-11 w-11 rounded-xl object-contain"
          />
          <div className="min-w-0">
            <div className="truncate text-base font-semibold text-slate-900">
              StaffFlow
            </div>
            <div className="truncate text-xs text-slate-500">
              CRM · ATS · Workforce
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <nav className="space-y-4">
          {visibleSections.map((section) => {
            const isOpen = expanded[section.key] ?? true;

            return (
              <div key={section.key} className="rounded-2xl">
                <button
                  type="button"
                  onClick={() => toggleSection(section.key)}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 hover:bg-slate-50"
                >
                  <span>{section.label}</span>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>

                {isOpen ? (
                  <div className="mt-1 space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink key={item.to} to={item.to} className={itemClass}>
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}