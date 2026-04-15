import React, { useMemo } from "react";
import { calculatePayrollItem } from "@/api/payroll";

export default function PayrollAdjustmentEditor({ item, setItem }) {
  const totals = useMemo(() => calculatePayrollItem(item), [item]);

  const update = (key, value) => {
    setItem((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="rounded-2xl border bg-card p-5 space-y-4">
      <h3 className="text-lg font-semibold">Payroll Item Editor</h3>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm mb-1">Regular Hours</label>
          <input type="number" value={item.regular_hours} onChange={(e) => update("regular_hours", e.target.value)} className="w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Overtime Hours</label>
          <input type="number" value={item.overtime_hours} onChange={(e) => update("overtime_hours", e.target.value)} className="w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Hourly Rate</label>
          <input type="number" value={item.hourly_rate} onChange={(e) => update("hourly_rate", e.target.value)} className="w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Bonuses</label>
          <input type="number" value={item.bonuses} onChange={(e) => update("bonuses", e.target.value)} className="w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Deductions</label>
          <input type="number" value={item.deductions} onChange={(e) => update("deductions", e.target.value)} className="w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Taxes</label>
          <input type="number" value={item.taxes} onChange={(e) => update("taxes", e.target.value)} className="w-full rounded-lg border px-3 py-2" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border p-4">Gross Pay: {totals.gross_pay}</div>
        <div className="rounded-xl border p-4">Net Pay: {totals.net_pay}</div>
      </div>
    </div>
  );
}
