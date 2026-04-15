import { supabase } from "@/lib/supabaseClient";
import { getProfileOrThrow } from "@/lib/profile";

export function calculatePayrollItem({ regular_hours, overtime_hours, hourly_rate, deductions = 0, bonuses = 0, taxes = 0 }) {
  const regularPay = Number(regular_hours || 0) * Number(hourly_rate || 0);
  const overtimePay = Number(overtime_hours || 0) * Number(hourly_rate || 0) * 1.5;
  const gross = regularPay + overtimePay + Number(bonuses || 0);
  const net = gross - Number(deductions || 0) - Number(taxes || 0);

  return {
    gross_pay: Number(gross.toFixed(2)),
    net_pay: Number(net.toFixed(2)),
  };
}

export async function generatePayrollRun(currentUser, payload) {
  const profile = await getProfileOrThrow(currentUser.id);

  const { data: run, error: runError } = await supabase
    .from("payroll_runs")
    .insert({
      organization_id: profile.organization_id,
      title: payload.title,
      period_start: payload.period_start,
      period_end: payload.period_end,
      run_mode: payload.run_mode || "manual",
      status: "draft",
      created_by: currentUser.id,
      updated_by: currentUser.id,
    })
    .select()
    .single();

  if (runError) throw runError;
  return run;
}
export async function savePayrollItem(payrollRunId, employeeId, item) {
  const totals = calculatePayrollItem(item);

  const { data, error } = await supabase
    .from("payroll_items")
    .upsert(
      {
        payroll_run_id: payrollRunId,
        employee_id: employeeId,
        regular_hours: Number(item.regular_hours || 0),
        overtime_hours: Number(item.overtime_hours || 0),
        hourly_rate: Number(item.hourly_rate || 0),
        bonuses: Number(item.bonuses || 0),
        deductions: Number(item.deductions || 0),
        taxes: Number(item.taxes || 0),
        gross_pay: totals.gross_pay,
        net_pay: totals.net_pay,
        calculation_meta: item.calculation_meta || {},
        updated_at: new Date().toISOString(),
      },
      { onConflict: "payroll_run_id,employee_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}
