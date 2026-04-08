import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import { AuthProvider } from "./lib/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import Candidates from "./pages/Candidates";
import Clients from "./pages/Clients";
import Contacts from "./pages/Contacts";
import Submissions from "./pages/Submissions";
import Interviews from "./pages/Interviews";
import Placements from "./pages/Placements";
import Activities from "./pages/Activities";
import RequestAccess from "./pages/RequestAccess";
import AIAssistant from "./pages/AIAssistant";
import ResumeParser from "./pages/ResumeParser";
import ClientBilling from "./pages/ClientBilling";

import UserManagement from "./pages/admin/UserManagement";
import ColumnSettings from "./pages/admin/ColumnSettings";
import Integrations from "./pages/admin/Integrations";

import Timesheets from "./pages/workforce/Timesheets";
import Expenses from "./pages/workforce/Expenses";
import Contracts from "./pages/workforce/Contracts";
import Onboarding from "./pages/workforce/Onboarding";
import Payroll from "./pages/workforce/Payroll";

const queryClient = new QueryClient();

function NotFound() {
  return <div className="p-10 text-xl">404 - Page Not Found</div>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/candidates" element={<Candidates />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/contacts" element={<Contacts />} />
                <Route path="/submissions" element={<Submissions />} />
                <Route path="/interviews" element={<Interviews />} />
                <Route path="/placements" element={<Placements />} />
                <Route path="/activities" element={<Activities />} />
                <Route path="/request-access" element={<RequestAccess />} />
                <Route path="/ai-assistant" element={<AIAssistant />} />
                <Route path="/resume-parser" element={<ResumeParser />} />
                <Route path="/client-billing" element={<ClientBilling />} />

                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/columns" element={<ColumnSettings />} />
                <Route path="/admin/integrations" element={<Integrations />} />

                <Route path="/workforce/timesheets" element={<Timesheets />} />
                <Route path="/workforce/expenses" element={<Expenses />} />
                <Route path="/workforce/contracts" element={<Contracts />} />
                <Route path="/workforce/onboarding" element={<Onboarding />} />
                <Route path="/workforce/payroll" element={<Payroll />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>

          <Toaster richColors position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}