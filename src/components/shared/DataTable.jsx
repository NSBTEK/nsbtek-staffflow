import React, { useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DataTable({
  data = [],
  columns = [],
  onEdit,
  onDelete,
  selectable = true,
  rowKey = "id",
}) {
  const [selectedRows, setSelectedRows] = useState([]);

  const allIds = useMemo(() => data.map((row) => row[rowKey]), [data, rowKey]);
  const allSelected = allIds.length > 0 && selectedRows.length === allIds.length;

  const toggleAll = () => {
    setSelectedRows(allSelected ? [] : allIds);
  };

  const toggleOne = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              {selectable && (
                <th className="px-4 py-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                  />
                </th>
              )}

              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left font-semibold text-foreground">
                  {col.label}
                </th>
              ))}

              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 2 : 1)}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No records found
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const id = row[rowKey];
                const selected = selectedRows.includes(id);

                return (
                  <tr
                    key={id}
                    className={cn(
                      "border-t border-border",
                      selected && "bg-primary/5"
                    )}
                  >
                    {selectable && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleOne(id)}
                        />
                      </td>
                    )}

                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 align-top">
                        {col.render ? col.render(row[col.key], row) : row[col.key] ?? "-"}
                      </td>
                    ))}

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit?.(row)}
                          className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 hover:bg-muted"
                        >
                          <Pencil className="w-4 h-4" />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => onDelete?.(row)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 text-red-600 px-3 py-1.5 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}