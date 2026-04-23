import React from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import AppShell from "@/components/app-shell/AppShell";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ModuleRoute from "@/components/auth/ModuleRoute";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import Clients from "@/pages/Clients";
import Contacts from "@/pages/Contacts";
import Candidates from "@/pages/Candidates";
import Jobs from "@/pages/Jobs";
import Submissions from "@/pages/Submissions";
import Placements from "@/pages/Placements";
import Interviews from "@/pages/Interviews";
import RequestAccess from "@/pages/RequestAccess";
import AIAssistant from "@/pages/AIAssistant";
import ResumeParser from "@/pages/ResumeParser";
import ClientBilling from "@/pages/ClientBilling";
import ForbiddenPage from "@/pages/ForbiddenPage";
import Unauthorized from "@/pages/Unauthorized";
import NotFoundPage from "@/pages/NotFoundPage";

import AuditLogs from "@/pages/admin/AuditLogs";
import ColumnSettings from "@/pages/admin/ColumnSettings";
import ExternalApplicants from "@/pages/admin/ExternalApplicants";
import ExternalJobs from "@/pages/admin/ExternalJobs";
import Integrations from "@/pages/admin/Integrations";
import AdminRequestAccess from "@/pages/admin/RequestAccess";
import RoleGroups from "@/pages/admin/RoleGroups";
import UserManagement from "@/pages/admin/UserManagement";

import Contracts from "@/pages/workforce/Contracts";
import Expenses from "@/pages/workforce/Expenses";
import Onboarding from "@/pages/workforce/Onboarding";
import Payroll from "@/pages/workforce/Payroll";
import Timesheets from "@/pages/workforce/Timesheets";
import Activities from "@/pages/Activities";

function ShellLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<ShellLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />

            {/* CRM */}
            <Route
              path="/clients"
              element={
                <ModuleRoute moduleKey="clients">
                  <Clients />
                </ModuleRoute>
              }
            />
            <Route
              path="/contacts"
              element={
                <ModuleRoute moduleKey="contacts">
                  <Contacts />
                </ModuleRoute>
              }
            />

            {/* ATS */}
            <Route
              path="/jobs"
              element={
                <ModuleRoute moduleKey="jobs">
                  <Jobs />
                </ModuleRoute>
              }
            />
            <Route
  path="/activities"
  element={
    <ModuleRoute moduleKey="activities">
      <Activities />
    </ModuleRoute>
  }
/>
            <Route
              path="/candidates"
              element={
                <ModuleRoute moduleKey="candidates">
                  <Candidates />
                </ModuleRoute>
              }
            />
            <Route
              path="/submissions"
              element={
                <ModuleRoute moduleKey="submissions">
                  <Submissions />
                </ModuleRoute>
              }
            />
            <Route
              path="/placements"
              element={
                <ModuleRoute moduleKey="placements">
                  <Placements />
                </ModuleRoute>
              }
            />
            <Route
              path="/interviews"
              element={
                <ModuleRoute moduleKey="interviews">
                  <Interviews />
                </ModuleRoute>
              }
            />

            {/* Workforce */}
            <Route
              path="/timesheets"
              element={
                <ModuleRoute moduleKey="timesheets">
                  <Timesheets />
                </ModuleRoute>
              }
            />
            <Route
              path="/expenses"
              element={
                <ModuleRoute moduleKey="expenses">
                  <Expenses />
                </ModuleRoute>
              }
            />
            <Route
              path="/contracts"
              element={
                <ModuleRoute moduleKey="contracts">
                  <Contracts />
                </ModuleRoute>
              }
            />
            <Route
              path="/onboarding"
              element={
                <ModuleRoute moduleKey="onboarding">
                  <Onboarding />
                </ModuleRoute>
              }
            />
            <Route
              path="/payroll"
              element={
                <ModuleRoute moduleKey="payroll">
                  <Payroll />
                </ModuleRoute>
              }
            />

            {/* Other modules */}
            <Route
              path="/request-access"
              element={
                <ModuleRoute moduleKey="request_access">
                  <RequestAccess />
                </ModuleRoute>
              }
            />
            <Route
              path="/ai-assistant"
              element={
                <ModuleRoute moduleKey="ai_assistant">
                  <AIAssistant />
                </ModuleRoute>
              }
            />
            <Route
              path="/resume-parser"
              element={
                <ModuleRoute moduleKey="resume_parser">
                  <ResumeParser />
                </ModuleRoute>
              }
            />
            <Route
              path="/client-billing"
              element={
                <ModuleRoute moduleKey="client_billing">
                  <ClientBilling />
                </ModuleRoute>
              }
            />

            {/* Admin */}
            <Route
              path="/admin/audit-logs"
              element={
                <ModuleRoute moduleKey="users">
                  <AuditLogs />
                </ModuleRoute>
              }
            />
            <Route
              path="/admin/column-settings"
              element={
                <ModuleRoute moduleKey="columns">
                  <ColumnSettings />
                </ModuleRoute>
              }
            />
            <Route
              path="/admin/external-applicants"
              element={
                <ModuleRoute moduleKey="integrations">
                  <ExternalApplicants />
                </ModuleRoute>
              }
            />
            <Route
              path="/admin/external-jobs"
              element={
                <ModuleRoute moduleKey="integrations">
                  <ExternalJobs />
                </ModuleRoute>
              }
            />
            <Route
              path="/admin/integrations"
              element={
                <ModuleRoute moduleKey="integrations">
                  <Integrations />
                </ModuleRoute>
              }
            />
            <Route
              path="/admin/request-access"
              element={
                <ModuleRoute moduleKey="request_access">
                  <AdminRequestAccess />
                </ModuleRoute>
              }
            />
            <Route
              path="/admin/role-groups"
              element={
                <ModuleRoute moduleKey="users">
                  <RoleGroups />
                </ModuleRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ModuleRoute moduleKey="users">
                  <UserManagement />
                </ModuleRoute>
              }
            />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}