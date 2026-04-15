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
      { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard", module: "dashboard" },
    ],
  },
  {
    label: "Recruitment",
    items: [
      { icon: Building2, label: "Clients", to: "/clients", module: "clients" },
      { icon: UserCircle, label: "Contacts", to: "/contacts", module: "contacts" },
      { icon: ActivityIcon, label: "Activities", to: "/activities", module: "activities" },
      { icon: Briefcase, label: "Jobs", to: "/jobs", module: "jobs" },
      { icon: Users, label: "Candidates", to: "/candidates", module: "candidates" },
      { icon: Send, label: "Submissions", to: "/submissions", module: "submissions" },
      { icon: Calendar, label: "Interviews", to: "/interviews", module: "interviews" },
      { icon: Award, label: "Placements", to: "/placements", module: "placements" },
    ],
  },
  {
    label: "Productivity",
    items: [
      { icon: Sparkles, label: "AI Assistant", to: "/ai-assistant", module: "ai_assistant" },
      { icon: ScanText, label: "Resume Parser", to: "/resume-parser", module: "resume_parser" },
      { icon: ReceiptText, label: "Client Billing", to: "/client-billing", module: "client_billing" },
      { icon: KeyRound, label: "Request Access", to: "/request-access" },
    ],
  },
  {
    label: "Workforce",
    items: [
      { icon: Clock, label: "Timesheets", to: "/timesheets", module: "timesheets" },
      { icon: DollarSign, label: "Expenses", to: "/expenses", module: "expenses" },
      { icon: FileText, label: "Contracts", to: "/contracts", module: "contracts" },
      { icon: UserCheck, label: "Onboarding", to: "/onboarding", module: "onboarding" },
      { icon: DollarSign, label: "Payroll", to: "/payroll", module: "payroll" },
    ],
  },
  {
    label: "Admin",
    items: [
      { icon: Columns3, label: "Column Settings", to: "/admin/columns", module: "users" },
      { icon: ShieldCheck, label: "User Management", to: "/admin/users", module: "users" },
      { icon: ShieldCheck, label: "Role Groups", to: "/admin/role-groups", module: "users" },
      { icon: Plug, label: "Integrations", to: "/admin/integrations", module: "users" },
    ],
  },
];

export default function Sidebar({ onNavigate, mobile = false }) {
  const location = useLocation();
  const { user } = useCurrentUser();

  const [openSections, setOpenSections] = useState(() =>
    Object.fromEntries(navSections.map((section) => [section.label, true]))
  );

  const visibleSections = useMemo(() => {
    return navSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (!item.module) return true;
          return canView(user, item.module);
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [user]);

  const toggleSection = (label) => {
    setOpenSections((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  return (
    <div
      className={cn(
        "flex h-screen w-[280px] flex-col border-r bg-card",
        mobile && "h-full w-full border-r-0"
      )}
    >
      <div className="border-b px-4 py-4">
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="NSBTEK Logo"
            className="h-9 w-auto object-contain"
          />
          <div>
            <div className="text-sm font-semibold">NSBTEK StaffFlow</div>
            <div className="text-xs text-muted-foreground">Operations Portal</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {visibleSections.map((section) => {
          const isOpen = openSections[section.label];

          return (
            <div key={section.label} className="mb-4">
              <button
                type="button"
                onClick={() => toggleSection(section.label)}
                className="mb-2 flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground hover:bg-muted"
              >
                <span>{section.label}</span>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {isOpen ? (
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const active =
                      location.pathname === item.to ||
                      location.pathname.startsWith(`${item.to}/`);

                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                          active
                            ? "bg-blue-600 text-white"
                            : "text-foreground hover:bg-muted"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}