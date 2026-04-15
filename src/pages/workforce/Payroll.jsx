import React, { useMemo, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { generatePayrollRun, calculatePayrollItem } from "@/api/payroll";

async function listPayrollRuns() {
  const { data, error } = await supabase
    .from("payroll_runs")
    .select(`
      *,
      payroll_items (*)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export default function Payroll() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    period_start: "",
    period_end: "",
    run_mode: "manual",
  });

  const { data: runs = [], isLoading, error } = useQuery({
    queryKey: ["payroll-runs", authUser?.id],
    queryFn: listPayrollRuns,
    enabled: !!authUser?.id,
  });

  const createRunMutation = useMutation({
    mutationFn: (payload) => generatePayrollRun(authUser, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-runs", authUser?.id] });
      setForm({ title: "", period_start: "", period_end: "", run_mode: "manual" });
    },
  });

  const previewExample = useMemo(() => {
    return calculatePayrollItem({
      regular_hours: 40,
      overtime_hours: 5,
      hourly_rate: 30,
      deductions: 120,
      bonuses: 200,
      taxes: 250,
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payroll</h1>
        <p className="text-muted-foreground">Create manual or automated payroll runs with editable calculations.</p>
      </div>

      <div className="rounded-2xl border bg-card p-5 space-y-4">
        <h2 className="text-lg font-semibold">Create Payroll Run</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Title</label>
            <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Run Mode</label>
            <select value={form.run_mode} onChange={(e) => setForm((p) => ({ ...p, run_mode: e.target.value }))} className="w-full rounded-lg border px-3 py-2">
              <option value="manual">Manual</option>
              <option value="automated">Automated</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Period Start</label>
            <input type="date" value={form.period_start} onChange={(e) => setForm((p) => ({ ...p, period_start: e.target.value }))} className="w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Period End</label>
            <input type="date" value={form.period_end} onChange={(e) => setForm((p) => ({ ...p, period_end: e.target.value }))} className="w-full rounded-lg border px-3 py-2" />
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={() => createRunMutation.mutate(form)} className="rounded-xl bg-blue-600 text-white px-4 py-2 font-medium">
            Create Run
          </button>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-5 space-y-3">
        <h2 className="text-lg font-semibold">Calculation Preview</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border p-4">Gross Pay: {previewExample.gross_pay}</div>
          <div className="rounded-xl border p-4">Net Pay: {previewExample.net_pay}</div>
          <div className="rounded-xl border p-4">Manual adjustments supported</div>
          <div className="rounded-xl border p-4">Live formula editing supported</div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-5 space-y-4">
        <h2 className="text-lg font-semibold">Payroll Runs</h2>
        {isLoading ? (
          <div>Loading payroll runs...</div>
        ) : error ? (
          <div className="text-red-600">{error.message}</div>
        ) : runs.length === 0 ? (
          <div className="text-muted-foreground">No payroll runs created yet.</div>
        ) : (
          <div className="space-y-3">
            {runs.map((run) => (
              <div key={run.id} className="rounded-xl border p-4">
                <div className="font-medium">{run.title}</div>
                <div className="text-sm text-muted-foreground">{run.period_start} to {run.period_end}</div>
                <div className="text-sm text-muted-foreground">Status: {run.status} | Mode: {run.run_mode}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
