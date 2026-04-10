import React, { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  UserCircle,
  Activity as ActivityIcon,
  Briefcase,
  Users,
  Send,
  Calendar,
  Award,
  KeyRound,
  Clock,
  DollarSign,
  FileText,
  UserCheck,
  Sparkles,
  ScanText,
  ReceiptText,
  ShieldCheck,
  Columns3,
  Plug,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { canView } from "@/lib/permissions";
import logo from "@/assets/logo.png";

const navSections = [
  {
    label: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", module: "dashboard" },
    ],
  },
  {
    label: "CRM",
    items: [
      { icon: Building2, label: "Clients", path: "/clients", module: "clients" },
      { icon: UserCircle, label: "Contacts", path: "/contacts", module: "contacts" },
      { icon: ActivityIcon, label: "Activities", path: "/activities", module: "activities" },
    ],
  },
  {
    label: "ATS",
    items: [
      { icon: Briefcase, label: "Jobs", path: "/jobs", module: "jobs" },
      { icon: Users, label: "Candidates", path: "/candidates", module: "candidates" },
      { icon: Send, label: "Submissions", path: "/submissions", module: "submissions" },
      { icon: Calendar, label: "Interviews", path: "/interviews", module: "interviews" },
      { icon: Award, label: "Placements", path: "/placements", module: "placements" },
    ],
  },
  {
    label: "HR",
    items: [
      { icon: KeyRound, label: "Request Access", path: "/request-access", module: "request_access" },
    ],
  },
  {
    label: "Workforce",
    items: [
      { icon: Clock, label: "Timesheets", path: "/workforce/timesheets", module: "timesheets" },
      { icon: DollarSign, label: "Expenses", path: "/workforce/expenses", module: "expenses" },
      { icon: FileText, label: "Contracts", path: "/workforce/contracts", module: "contracts" },
      { icon: UserCheck, label: "Onboarding", path: "/workforce/onboarding", module: "onboarding" },
      { icon: ReceiptText, label: "Payroll", path: "/workforce/payroll", module: "payroll" },
    ],
  },
  {
    label: "AI",
    items: [
      { icon: Sparkles, label: "AI Assistant", path: "/ai-assistant", module: "ai_assistant" },
      { icon: ScanText, label: "Resume Parser", path: "/resume-parser", module: "resume_parser" },
      { icon: ReceiptText, label: "Client Billing", path: "/client-billing", module: "client_billing" },
    ],
  },
  {
    label: "Admin Setup",
    items: [
      { icon: ShieldCheck, label: "Users", path: "/admin/users", module: "users" },
      { icon: ShieldCheck, label: "Role Groups", path: "/admin/role-groups", module: "users" },
      { icon: Columns3, label: "Columns", path: "/admin/columns", module: "columns" },
      { icon: Plug, label: "Integrations", path: "/admin/integrations", module: "integrations" },
    ],
  },
];

export default function Sidebar() {
  const location = useLocation();
  const { user, isLoading } = useCurrentUser();

  const visibleSections = useMemo(() => {
    return navSections
      .map((section) => {
        const items = section.items.filter((item) => canView(user, item.module));
        return { ...section, items };
      })
      .filter((section) => section.items.length > 0);
  }, [user]);

  const [openSections, setOpenSections] = useState(() =>
    Object.fromEntries(navSections.map((s) => [s.label, true]))
  );

  const toggleSection = (label) => {
    setOpenSections((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  if (isLoading) {
    return (
      <aside className="w-72 shrink-0 border-r border-border bg-slate-950 text-slate-200 h-screen sticky top-0 overflow-y-auto">
        <div className="p-5 text-sm text-white/70">Loading navigation...</div>
      </aside>
    );
  }

  return (
    <aside className="w-72 shrink-0 border-r border-border bg-slate-950 text-slate-200 h-screen sticky top-0 overflow-y-auto">
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="NSBTEK Logo"
            className="h-10 w-auto object-contain"
          />
          <div>
            <div className="text-base font-bold text-white leading-tight">NSBTEK</div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-blue-300">
              StaffFlow
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-white/50">
          {user?.full_name || user?.email || "User"}
        </div>
        <div className="text-[11px] uppercase tracking-wider text-blue-300 mt-1">
          {user?.role || "viewer"}
        </div>
      </div>

      <div className="p-3 space-y-3">
        {visibleSections.map((section) => (
          <div key={section.label}>
            <button
              type="button"
              onClick={() => toggleSection(section.label)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white"
            >
              <span>{section.label}</span>
              {openSections[section.label] ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {openSections[section.label] && (
              <div className="mt-1 space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active =
                    location.pathname === item.path ||
                    location.pathname.startsWith(`${item.path}/`);

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-white/10 text-white"
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}