import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { getProfileOrThrow } from "@/lib/profile";
import { createAccessRequest, reviewAccessRequest } from "@/api/accessRequests";
import { MODULES } from "@/lib/permissions";

async function listAccessRequests(currentUser) {
  const profile = await getProfileOrThrow(currentUser.id);

  let query = supabase
    .from("access_requests")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false });

  if (!["admin", "manager"].includes(profile.role)) {
    query = query.eq("requester_id", profile.id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export default function RequestAccess() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    requested_module: "dashboard",
    requested_level: "view",
    reason: "",
  });

  const { data: profile } = useQuery({
    queryKey: ["current-profile-request-access", authUser?.id],
    queryFn: () => getProfileOrThrow(authUser.id),
    enabled: !!authUser?.id,
  });

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ["access-requests", authUser?.id],
    queryFn: () => listAccessRequests(authUser),
    enabled: !!authUser?.id,
  });

  const createMutation = useMutation({
    mutationFn: (payload) => createAccessRequest(authUser, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["access-requests", authUser?.id] });
      setForm({ requested_module: "dashboard", requested_level: "view", reason: "" });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, decision }) => reviewAccessRequest(authUser, id, decision),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["access-requests", authUser?.id] });
      queryClient.invalidateQueries({ queryKey: ["current-user", authUser?.id] });
    },
  });

  const isReviewer = ["admin", "manager"].includes(profile?.role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Request Access</h1>
        <p className="text-muted-foreground">Users can request access to modules and managers/admins can review them.</p>
      </div>

      <div className="rounded-2xl border bg-card p-5 space-y-4">
        <h2 className="text-lg font-semibold">New Request</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Module</label>
            <select
              value={form.requested_module}
              onChange={(e) => setForm((prev) => ({ ...prev, requested_module: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2"
            >
              {MODULES.map((module) => (
                <option key={module} value={module}>{module}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Access Level</label>
            <select
              value={form.requested_level}
              onChange={(e) => setForm((prev) => ({ ...prev, requested_level: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2"
            >
              <option value="view">view</option>
              <option value="edit">edit</option>
              <option value="own">own</option>
              <option value="view_own">view_own</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">Reason</label>
          <textarea
            value={form.reason}
            onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
            rows={4}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => createMutation.mutate(form)}
            className="rounded-xl bg-blue-600 text-white px-4 py-2 font-medium"
          >
            Submit Request
          </button>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-5 space-y-4">
        <h2 className="text-lg font-semibold">Requests</h2>
        {isLoading ? (
          <div>Loading requests...</div>
        ) : error ? (
          <div className="text-red-600">{error.message}</div>
        ) : rows.length === 0 ? (
          <div className="text-muted-foreground">No access requests found.</div>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <div key={row.id} className="rounded-xl border p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{row.requested_module} — {row.requested_level}</div>
                    <div className="text-sm text-muted-foreground">Status: {row.status}</div>
                    {row.reason && <div className="text-sm mt-1">{row.reason}</div>}
                  </div>
                  {isReviewer && row.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => reviewMutation.mutate({ id: row.id, decision: "rejected" })}
                        className="rounded-lg border border-red-200 text-red-600 px-3 py-1.5"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => reviewMutation.mutate({ id: row.id, decision: "approved" })}
                        className="rounded-lg bg-green-600 text-white px-3 py-1.5"
                      >
                        Approve
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
