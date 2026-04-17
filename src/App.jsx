import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";

import { AuthProvider } from "@/lib/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ProtectedModuleRoute from "@/components/auth/ProtectedModuleRoute";
import AppLayout from "@/components/layout/AppLayout";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import ResetPassword from "@/pages/ResetPassword";
import Unauthorized from "@/pages/Unauthorized";

import Dashboard from "@/pages/Dashboard";
import Clients from "@/pages/Clients";
import Contacts from "@/pages/Contacts";
import Activities from "@/pages/Activities";
import Jobs from "@/pages/Jobs";
import Candidates from "@/pages/Candidates";
import Submissions from "@/pages/Submissions";
import Interviews from "@/pages/Interviews";
import Placements from "@/pages/Placements";
import AIAssistant from "@/pages/AIAssistant";
import ResumeParser from "@/pages/ResumeParser";
import ClientBilling from "@/pages/ClientBilling";
import RequestAccess from "@/pages/RequestAccess";

import ColumnSettings from "@/pages/admin/ColumnSettings";
import UserManagement from "@/pages/admin/UserManagement";
import RoleGroups from "@/pages/admin/RoleGroups";
import Integrations from "@/pages/admin/Integrations";

import Timesheets from "@/pages/workforce/Timesheets";
import Expenses from "@/pages/workforce/Expenses";
import Contracts from "@/pages/workforce/Contracts";
import Onboarding from "@/pages/workforce/Onboarding";
import Payroll from "@/pages/workforce/Payroll";

const BASENAME = import.meta.env.BASE_URL || "/";

export default function App() {
  return (
    <BrowserRouter basename={BASENAME}>
      <AuthProvider>
        <Toaster richColors position="top-right" />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<ProtectedModuleRoute module="dashboard" />}>
                <Route index element={<Dashboard />} />
              </Route>

              <Route path="/clients" element={<ProtectedModuleRoute module="clients" />}>
                <Route index element={<Clients />} />
              </Route>

              <Route path="/contacts" element={<ProtectedModuleRoute module="contacts" />}>
                <Route index element={<Contacts />} />
              </Route>

              <Route path="/activities" element={<ProtectedModuleRoute module="activities" />}>
                <Route index element={<Activities />} />
              </Route>

              <Route path="/jobs" element={<ProtectedModuleRoute module="jobs" />}>
                <Route index element={<Jobs />} />
              </Route>

              <Route path="/candidates" element={<ProtectedModuleRoute module="candidates" />}>
                <Route index element={<Candidates />} />
              </Route>

              <Route path="/submissions" element={<ProtectedModuleRoute module="submissions" />}>
                <Route index element={<Submissions />} />
              </Route>

              <Route path="/interviews" element={<ProtectedModuleRoute module="interviews" />}>
                <Route index element={<Interviews />} />
              </Route>

              <Route path="/placements" element={<ProtectedModuleRoute module="placements" />}>
                <Route index element={<Placements />} />
              </Route>

              <Route path="/ai-assistant" element={<ProtectedModuleRoute module="ai_assistant" />}>
                <Route index element={<AIAssistant />} />
              </Route>

              <Route path="/resume-parser" element={<ProtectedModuleRoute module="resume_parser" />}>
                <Route index element={<ResumeParser />} />
              </Route>

              <Route path="/client-billing" element={<ProtectedModuleRoute module="client_billing" />}>
                <Route index element={<ClientBilling />} />
              </Route>

              <Route path="/request-access" element={<ProtectedModuleRoute module="request_access" />}>
                <Route index element={<RequestAccess />} />
              </Route>

              <Route path="/timesheets" element={<ProtectedModuleRoute module="timesheets" />}>
                <Route index element={<Timesheets />} />
              </Route>

              <Route path="/expenses" element={<ProtectedModuleRoute module="expenses" />}>
                <Route index element={<Expenses />} />
              </Route>

              <Route path="/contracts" element={<ProtectedModuleRoute module="contracts" />}>
                <Route index element={<Contracts />} />
              </Route>

              <Route path="/onboarding" element={<ProtectedModuleRoute module="onboarding" />}>
                <Route index element={<Onboarding />} />
              </Route>

              <Route path="/payroll" element={<ProtectedModuleRoute module="payroll" />}>
                <Route index element={<Payroll />} />
              </Route>

              <Route path="/admin/columns" element={<ProtectedModuleRoute module="columns" />}>
                <Route index element={<ColumnSettings />} />
              </Route>

              <Route path="/admin/users" element={<ProtectedModuleRoute module="users" />}>
                <Route index element={<UserManagement />} />
              </Route>

              <Route path="/admin/role-groups" element={<ProtectedModuleRoute module="users" />}>
                <Route index element={<RoleGroups />} />
              </Route>

              <Route path="/admin/integrations" element={<ProtectedModuleRoute module="integrations" />}>
                <Route index element={<Integrations />} />
              </Route>

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}