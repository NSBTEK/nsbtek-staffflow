import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Briefcase,
  Users,
  Building2,
  Cpu,
  Workflow,
  BarChart3,
  BarChart2,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  Menu,
  X,
} from "lucide-react";
import logo from "@/assets/logo.png";

function FeatureCard({ icon: Icon, title, text }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition hover:bg-white/[0.07] hover:border-white/15 sm:p-6">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-500/15 text-blue-300 sm:h-11 sm:w-11">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-white sm:text-lg">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
    </div>
  );
}

function ServiceCard({ title, text, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition hover:border-blue-400/30 hover:bg-white/[0.07] sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-white sm:text-lg">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
        </div>
        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-blue-300 group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}

function MobileNavButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/[0.08]"
    >
      {children}
    </button>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const [contact, setContact] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const scrollToSection = (id) => {
    setMenuOpen(false);

    if (id === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleLogin = () => {
    setMenuOpen(false);
    navigate("/login");
  };

  const serviceItems = useMemo(
    () => [
      {
        title: "ATS + Pipeline",
        text: "Track jobs, candidates, submissions, interviews, and placements with cleaner handoffs and better visibility.",
      },
      {
        title: "CRM + Relationships",
        text: "Manage companies, contacts, and activities in one operational system built for staffing teams.",
      },
      {
        title: "Workforce Operations",
        text: "Support timesheets, expenses, onboarding, contracts, payroll, and approvals with role-aware access.",
      },
      {
        title: "AI-First Admin",
        text: "Control permissions, role groups, module access, and configuration from one secure workspace.",
      },
    ],
    []
  );

  const footerServices = [
    "ATS + Pipeline",
    "CRM + Relationships",
    "Workforce Operations",
    "Admin + Governance",
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={() => scrollToSection("top")}
            className="flex items-center gap-3 border-0 bg-transparent p-0 text-left"
          >
            <img
              src={logo}
              alt="NSBTEK Logo"
              className="h-9 w-auto object-contain sm:h-10"
            />
            <div>
              <p className="text-sm font-bold leading-tight text-white">NSBTEK</p>
              <p className="text-[10px] uppercase tracking-[0.25em] text-blue-400">
                Think Big | AI-First
              </p>
            </div>
          </button>

          <div className="hidden items-center gap-6 md:flex">
            <button
              type="button"
              onClick={() => scrollToSection("services")}
              className="text-sm text-slate-300 transition hover:text-white"
            >
              Services
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("about")}
              className="text-sm text-slate-300 transition hover:text-white"
            >
              About
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("contact")}
              className="text-sm text-slate-300 transition hover:text-white"
            >
              Contact
            </button>
            <button
              onClick={handleLogin}
              className="rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-white hover:bg-white/5"
            >
              Login
            </button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={handleLogin}
              className="rounded-xl border border-white/15 px-3 py-2 text-sm font-medium text-white hover:bg-white/5"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="rounded-xl border border-white/15 p-2 text-white hover:bg-white/5"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOpen ? (
          <div className="border-t border-white/10 bg-slate-950 px-4 py-4 md:hidden">
            <div className="space-y-3">
              <MobileNavButton onClick={() => scrollToSection("services")}>
                Services
              </MobileNavButton>
              <MobileNavButton onClick={() => scrollToSection("about")}>
                About
              </MobileNavButton>
              <MobileNavButton onClick={() => scrollToSection("contact")}>
                Contact
              </MobileNavButton>
            </div>
          </div>
        ) : null}
      </header>

      <main>
        <section className="relative overflow-hidden" id="top">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.22),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.18),transparent_24%)]" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[1.2fr_0.8fr] lg:gap-12 lg:py-24">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-blue-300 sm:text-xs">
                <Sparkles className="h-3.5 w-3.5" />
                Unified CRM · ATS · HR · Workforce
              </div>

              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-6xl">
                Run your hiring and workforce operations from one elegant system.
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">
                NSBTEK StaffFlow brings together clients, contacts, jobs,
                candidates, submissions, interviews, placements, workforce
                approvals, and admin controls in one AI-first platform designed
                for clarity, speed, and control.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <button
                  onClick={handleLogin}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 hover:bg-blue-500"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection("contact")}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300 hover:bg-white/[0.07]"
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  Contact Us Today
                </button>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-2xl font-semibold text-white">All-in-one</div>
                  <div className="mt-1 text-sm text-slate-400">
                    CRM, ATS, HR and operations unified
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-2xl font-semibold text-white">Secure</div>
                  <div className="mt-1 text-sm text-slate-400">
                    Organization-scoped data and file access
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:col-span-2 lg:col-span-1">
                  <div className="text-2xl font-semibold text-white">Configurable</div>
                  <div className="mt-1 text-sm text-slate-400">
                    Custom columns, permissions and role groups
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-4 shadow-2xl sm:p-5">
                <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.22em] text-blue-300 sm:text-xs">
                        Executive Snapshot
                      </div>
                      <div className="mt-2 text-lg font-semibold text-white sm:text-xl">
                        Operations at a glance
                      </div>
                    </div>
                    <div className="rounded-2xl bg-blue-500/15 p-3 text-blue-300">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs uppercase tracking-wider text-slate-400">
                        Open Jobs
                      </div>
                      <div className="mt-2 text-3xl font-semibold">24</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs uppercase tracking-wider text-slate-400">
                        Candidates
                      </div>
                      <div className="mt-2 text-3xl font-semibold">186</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs uppercase tracking-wider text-slate-400">
                        Placements
                      </div>
                      <div className="mt-2 text-3xl font-semibold">17</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs uppercase tracking-wider text-slate-400">
                        Approvals
                      </div>
                      <div className="mt-2 text-3xl font-semibold">9</div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm font-medium text-white">
                      Workflow Highlights
                    </div>
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-slate-300">
                          Candidate pipeline movement
                        </span>
                        <span className="text-emerald-300">Healthy</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-slate-300">Timesheet approvals</span>
                        <span className="text-amber-300">Needs review</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-slate-300">Client activity coverage</span>
                        <span className="text-blue-300">Strong</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 backdrop-blur lg:absolute lg:-bottom-6 lg:-left-6 lg:mt-0">
                AI-first operations for modern staffing teams
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">
              Services
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Designed for operational clarity
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-400 sm:text-base">
              Every core workflow lives in one place, so your team spends less
              time switching tools and more time moving work forward.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <FeatureCard
              icon={Briefcase}
              title="ATS + Pipeline"
              text="Track jobs, candidates, submissions, interviews, and placements with better visibility and cleaner handoffs."
            />
            <FeatureCard
              icon={Building2}
              title="CRM + Relationships"
              text="Manage client companies, contacts, and activities in a structure that stays usable as your team grows."
            />
            <FeatureCard
              icon={Workflow}
              title="Approvals + Workforce"
              text="Support timesheets, expenses, contracts, onboarding, and payroll with role-aware reviews and admin oversight."
            />
            <FeatureCard
              icon={Cpu}
              title="Admin + Governance"
              text="Use role groups, column settings, permissions, and secure organization scoping to stay in control."
            />
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {serviceItems.map((item) => (
              <ServiceCard
                key={item.title}
                title={item.title}
                text={item.text}
                onClick={() => scrollToSection("contact")}
              />
            ))}
          </div>
        </section>

        <section id="about" className="border-t border-white/10 bg-slate-900/60">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-blue-300">
                  <Users className="h-3.5 w-3.5" />
                  Built for teams
                </div>
                <h2 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">
                  One workspace for leadership, recruiters, managers, HR, and employees.
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-400 sm:text-base">
                  StaffFlow is structured so every role sees what they need,
                  without losing operational consistency. That means cleaner
                  approvals, better oversight, and fewer gaps across your
                  organization.
                </p>

                <div className="mt-8 space-y-3">
                  {[
                    "Centralized staffing operations",
                    "Role-based access and governance",
                    "Cleaner workflows across ATS, CRM, and HR",
                  ].map((point) => (
                    <div key={point} className="flex items-center gap-3 text-sm text-slate-300">
                      <CheckCircle2 className="h-4 w-4 text-blue-300" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="text-sm font-semibold text-white">Admins</div>
                  <p className="mt-2 text-sm text-slate-400">
                    Full visibility across role groups, users, approvals, and organization configuration.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="text-sm font-semibold text-white">Managers</div>
                  <p className="mt-2 text-sm text-slate-400">
                    Review direct-report workflows, oversee hiring progress, and unblock decisions faster.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="text-sm font-semibold text-white">Recruiters & Sales</div>
                  <p className="mt-2 text-sm text-slate-400">
                    Work across clients, jobs, candidates, submissions, and activity without scattered tools.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="text-sm font-semibold text-white">HR & Workforce</div>
                  <p className="mt-2 text-sm text-slate-400">
                    Support onboarding, payroll, expenses, and operational approvals with more control.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="rounded-[32px] border border-blue-500/20 bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-600 px-5 py-8 shadow-2xl sm:px-8 sm:py-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/20 bg-white/10 px-4 py-1.5 text-xs uppercase tracking-[0.22em] text-blue-100">
                  <BarChart2 className="h-3.5 w-3.5" />
                  NSBTEK Platform
                </div>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Manage your workforce with NSBTEK
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100/90 sm:text-base">
                  Our AI-powered staffing platform for ATS, CRM, and workforce
                  management — built specifically for staffing agencies and enterprises.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  onClick={handleLogin}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
                >
                  Login to StaffFlow
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection("contact")}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/30 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Contact Us Today
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#07111e] py-16 sm:py-20" id="contact">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-blue-400">
                  Get In Touch
                </p>
                <h2 className="mb-4 text-3xl font-extrabold text-white sm:text-4xl">
                  We&apos;re just a message away from smarter solutions
                </h2>
                <p className="mb-8 text-sm leading-7 text-white/50">
                  Reach out for a consultation, partnership, or to learn more
                  about our staffing and workforce platform.
                </p>

                <div className="space-y-4">
                  <a
                    href="mailto:hr@nsbtek.com"
                    className="flex items-center gap-3 text-white/70 transition-colors hover:text-white"
                  >
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <Mail className="h-4 w-4 text-blue-300" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-white/40">Email</p>
                      <p className="text-sm">hr@nsbtek.com</p>
                    </div>
                  </a>

                  <a
                    href="tel:+17324000000"
                    className="flex items-center gap-3 text-white/70 transition-colors hover:text-white"
                  >
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <Phone className="h-4 w-4 text-blue-300" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-white/40">Phone</p>
                      <p className="text-sm">+1 (732) 400-0000</p>
                    </div>
                  </a>

                  <div className="flex items-center gap-3 text-white/70">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <MapPin className="h-4 w-4 text-blue-300" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-white/40">Location</p>
                      <p className="text-sm">New Jersey, United States</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm sm:p-6">
                <div className="mb-5">
                  <h3 className="text-xl font-semibold text-white">Contact Us</h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Send a message and we&apos;ll get back to you.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    placeholder="Full Name"
                    value={contact.name}
                    onChange={(e) =>
                      setContact((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-blue-500/50"
                  />
                  <input
                    placeholder="Email Address"
                    value={contact.email}
                    onChange={(e) =>
                      setContact((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-blue-500/50"
                  />
                </div>

                <input
                  placeholder="Contact Number"
                  value={contact.phone}
                  onChange={(e) =>
                    setContact((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-blue-500/50"
                />

                <textarea
                  rows={4}
                  placeholder="Message"
                  value={contact.message}
                  onChange={(e) =>
                    setContact((prev) => ({ ...prev, message: e.target.value }))
                  }
                  className="mt-4 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-blue-500/50"
                />

                <button
                  type="button"
                  className="mt-4 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-500"
                >
                  Submit Message
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 bg-[#030a14] py-10">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <img
                src={logo}
                alt="NSBTEK Logo"
                className="h-9 w-auto object-contain"
              />
              <p className="text-sm font-bold text-white">NSBTEK</p>
            </div>
            <p className="text-xs leading-relaxed text-white/40">
              Elevate efficiency with scalable, future-ready staffing and workforce solutions.
            </p>
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-wider text-white/60">
              Quick Links
            </p>
            <button
              type="button"
              onClick={() => scrollToSection("top")}
              className="mb-2 block cursor-pointer border-0 bg-transparent p-0 text-xs text-white/40 transition-colors hover:text-white/70"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("about")}
              className="mb-2 block cursor-pointer border-0 bg-transparent p-0 text-xs text-white/40 transition-colors hover:text-white/70"
            >
              About Us
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("contact")}
              className="mb-2 block cursor-pointer border-0 bg-transparent p-0 text-xs text-white/40 transition-colors hover:text-white/70"
            >
              Contact Us
            </button>
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-wider text-white/60">
              Services
            </p>
            {footerServices.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => scrollToSection("services")}
                className="mb-2 block cursor-pointer border-0 bg-transparent p-0 text-xs text-white/40 transition-colors hover:text-white/70"
              >
                {item}
              </button>
            ))}
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-wider text-white/60">
              Contact
            </p>
            <a
              href="mailto:hr@nsbtek.com"
              className="mb-2 block text-xs text-white/40 transition-colors hover:text-white/70"
            >
              hr@nsbtek.com
            </a>
            <a
              href="tel:+17324000000"
              className="mb-2 block text-xs text-white/40 transition-colors hover:text-white/70"
            >
              +1 (732) 400-0000
            </a>
            <button
              type="button"
              onClick={() => scrollToSection("contact")}
              className="mt-2 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white hover:bg-white/[0.08]"
            >
              Contact Us
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-7xl px-4 sm:px-6">
          <div className="h-px w-full bg-white/5" />
          <p className="mt-6 text-xs text-white/30">
            © {new Date().getFullYear()} NSBTEK StaffFlow. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}