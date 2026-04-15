import React from "react";

export default function TimesheetWeekGrid({ entries, setEntries }) {
  const updateRow = (index, key, value) => {
    const next = [...entries];
    next[index] = { ...next[index], [key]: value };
    setEntries(next);
  };

  const total = entries.reduce((sum, row) => sum + Number(row.hours || 0), 0);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Hours</th>
              <th className="text-left p-3">Task Code</th>
              <th className="text-left p-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((row, index) => (
              <tr key={row.work_date} className="border-t">
                <td className="p-3">{row.work_date}</td>
                <td className="p-3">
                  <input
                    type="number"
                    step="0.25"
                    max="8"
                    min="0"
                    value={row.hours}
                    onChange={(e) => updateRow(index, "hours", e.target.value)}
                    className="w-24 rounded-lg border px-3 py-2"
                  />
                </td>
                <td className="p-3">
                  <input
                    type="text"
                    value={row.task_code || ""}
                    onChange={(e) => updateRow(index, "task_code", e.target.value)}
                    className="w-full rounded-lg border px-3 py-2"
                  />
                </td>
                <td className="p-3">
                  <input
                    type="text"
                    value={row.notes || ""}
                    onChange={(e) => updateRow(index, "notes", e.target.value)}
                    className="w-full rounded-lg border px-3 py-2"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-right font-semibold">Weekly Total: {total} hours</div>
    </div>
  );
}
