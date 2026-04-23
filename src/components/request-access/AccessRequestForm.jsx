import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import SearchableEntitySelect from "@/components/shared/SearchableEntitySelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const MODULE_OPTIONS = [
  { value: "dashboard", label: "Dashboard", description: "Overview and company workspace access" },
  { value: "clients", label: "Clients", description: "CRM client records and company relationships" },
  { value: "contacts", label: "Contacts", description: "Contact management and account-linked contacts" },
  { value: "activities", label: "Activities", description: "Task, note, and timeline activity access" },
  { value: "jobs", label: "Jobs", description: "Recruitment job openings and pipeline tracking" },
  { value: "candidates", label: "Candidates", description: "Candidate records, resumes, and progress" },
  { value: "submissions", label: "Submissions", description: "Candidate submissions to jobs or clients" },
  { value: "interviews", label: "Interviews", description: "Interview scheduling and coordination" },
  { value: "placements", label: "Placements", description: "Placement records and staffing outcomes" },
  { value: "timesheets", label: "Timesheets", description: "Employee and contractor time entry access" },
  { value: "expenses", label: "Expenses", description: "Workforce expense entry and approvals" },
  { value: "contracts", label: "Contracts", description: "Contract and agreement management" },
  { value: "onboarding", label: "Onboarding", description: "Onboarding task and checklist workflows" },
  { value: "payroll", label: "Payroll", description: "Payroll workflow and sync operations" },
  { value: "users", label: "User Management", description: "User invitation and account administration" },
  { value: "integrations", label: "Integrations", description: "External provider connections and sync" },
  { value: "request_access", label: "Request Access", description: "Access request submission and review" },
  { value: "ai_assistant", label: "AI Assistant", description: "AI workspace and intelligent tools" },
  { value: "resume_parser", label: "Resume Parser", description: "Resume upload and parsing tools" },
  { value: "client_billing", label: "Client Billing", description: "Billing and invoice-related workflows" },
];

const ACCESS_LEVEL_OPTIONS = [
  { value: "view", label: "View", description: "Read-only access" },
  { value: "view_own", label: "View Own", description: "Can only view own records" },
  { value: "own", label: "Own", description: "Can manage own records" },
  { value: "edit", label: "Edit", description: "Full edit access" },
];

async function submitAccessRequest({ currentUser, payload }) {
  // Keeps the UI working even before a backend function is wired.
  return {
    ok: true,
    requested_by: currentUser?.id || null,
    ...payload,
  };
}

export default function AccessRequestForm() {
  const { authUser } = useAuth();

  const [form, setForm] = useState({
    module_key: "",
    requested_level: "view",
    reason: "",
    related_entity_type: "",
    related_entity_id: "",
  });

  const mutation = useMutation({
    mutationFn: () =>
      submitAccessRequest({
        currentUser: authUser,
        payload: form,
      }),
    onSuccess: () => {
      toast.success("Access request submitted");
      setForm({
        module_key: "",
        requested_level: "view",
        reason: "",
        related_entity_type: "",
        related_entity_id: "",
      });
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to submit access request");
    },
  });

  const selectedModule = useMemo(
    () => MODULE_OPTIONS.find((x) => x.value === form.module_key),
    [form.module_key]
  );

  const handleChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.module_key) {
      toast.error("Please choose a module");
      return;
    }

    if (!form.reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }

    mutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Submit Access Request</h2>
        <p className="mt-1 text-sm text-slate-500">
          Request access to a module, workflow, or secured operational area.
        </p>
      </div>

      <SearchableEntitySelect
        label="Module"
        value={form.module_key}
        onChange={(value) => handleChange("module_key", value)}
        options={MODULE_OPTIONS}
        placeholder="Select a module"
      />

      {selectedModule ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <span className="font-medium text-slate-900">{selectedModule.label}:</span>{" "}
          {selectedModule.description}
        </div>
      ) : null}

      <SearchableEntitySelect
        label="Requested Access Level"
        value={form.requested_level}
        onChange={(value) => handleChange("requested_level", value)}
        options={ACCESS_LEVEL_OPTIONS}
        placeholder="Select access level"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Related Entity Type</label>
          <Input
            value={form.related_entity_type}
            onChange={(e) => handleChange("related_entity_type", e.target.value)}
            placeholder="Example: candidate, employee, job"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Related Entity ID</label>
          <Input
            value={form.related_entity_id}
            onChange={(e) => handleChange("related_entity_id", e.target.value)}
            placeholder="Optional linked record id"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">Reason</label>
        <Textarea
          value={form.reason}
          onChange={(e) => handleChange("reason", e.target.value)}
          placeholder="Explain why this access is needed"
          rows={5}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Submitting..." : "Submit Request"}
        </Button>
      </div>
    </form>
  );
}