import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Eye,
  EyeOff,
  BarChart2,
  PieChartIcon,
  LineChart,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const groupIcons = {
  stat: BarChart2,
  chart: PieChartIcon,
  list: LineChart,
};

const chartTypeOptions = [
  { value: "bar", label: "Bar" },
  { value: "horizontal_bar", label: "Horizontal" },
  { value: "line", label: "Line" },
  { value: "pie", label: "Pie" },
];

export default function DashboardCustomizer({
  open,
  onOpenChange,
  widgets = [],
  order = [],
  hidden = [],
  onOrderChange,
  onToggleHidden,
  chartTypes = {},
  onChartTypeChange,
}) {
  const orderedWidgets = order
    .map((id) => widgets.find((w) => w.id === id))
    .filter(Boolean);

  const moveItem = (index, direction) => {
    const next = [...order];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= next.length) return;

    [next[index], next[target]] = [next[target], next[index]];
    onOrderChange?.(next);
  };

  const groups = ["stat", "chart", "list"];
  const groupLabels = {
    stat: "Stat Cards",
    chart: "Charts",
    list: "Lists",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Customize Dashboard</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 max-h-[70vh] overflow-y-auto py-2">
          {groups.map((group) => {
            const sectionWidgets = orderedWidgets.filter((w) => w.group === group);
            if (!sectionWidgets.length) return null;

            const Icon = groupIcons[group] || BarChart2;

            return (
              <div key={group}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {groupLabels[group]}
                  </p>
                </div>

                <div className="space-y-2">
                  {sectionWidgets.map((widget) => {
                    const index = order.indexOf(widget.id);
                    const visible = !hidden.includes(widget.id);
                    const isChart = widget.group === "chart";

                    return (
                      <div
                        key={widget.id}
                        className={cn(
                          "rounded-xl border px-3 py-3",
                          visible
                            ? "border-primary/30 bg-primary/5"
                            : "border-border bg-background"
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium">{widget.label}</div>
                            <div className="text-xs text-muted-foreground">
                              Widget ID: {widget.id}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => moveItem(index, "up")}
                              className="rounded-lg border px-2 py-2 hover:bg-muted"
                              title="Move up"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => moveItem(index, "down")}
                              className="rounded-lg border px-2 py-2 hover:bg-muted"
                              title="Move down"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => onToggleHidden?.(widget.id)}
                              className="rounded-lg border px-2 py-2 hover:bg-muted"
                              title={visible ? "Hide widget" : "Show widget"}
                            >
                              {visible ? (
                                <Eye className="w-4 h-4 text-primary" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-muted-foreground" />
                              )}
                            </button>
                          </div>
                        </div>

                        {isChart && (
                          <div className="mt-3">
                            <label className="block text-xs font-medium text-muted-foreground mb-1">
                              Chart Type
                            </label>
                            <select
                              value={chartTypes[widget.id] || "bar"}
                              onChange={(e) =>
                                onChartTypeChange?.(widget.id, e.target.value)
                              }
                              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                            >
                              {chartTypeOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}