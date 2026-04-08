import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Eye,
  EyeOff,
  BarChart2,
  PieChartIcon,
  LineChart
} from 'lucide-react';
import { cn } from '@/lib/utils';

const groupIcons = {
  stat: BarChart2,
  chart: PieChartIcon,
  list: LineChart,
};

export default function DashboardCustomizer({
  open,
  onOpenChange,
  availableWidgets = [],
  visibleWidgets = [],
  onSave
}) {
  const [local, setLocal] = useState([]);

  useEffect(() => {
    if (open) {
      setLocal(visibleWidgets || []);
    }
  }, [visibleWidgets, open]);

  const toggle = (id) => {
    setLocal(prev =>
      prev.includes(id)
        ? prev.filter(w => w !== id)
        : [...prev, id]
    );
  };

  const handleSave = () => {
    onSave(local);
    onOpenChange(false);
  };

  const groups = ['stat', 'chart', 'list'];
  const groupLabels = {
    stat: 'Stat Cards',
    chart: 'Charts',
    list: 'Lists'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Customize Dashboard</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto py-2">
          {groups.map(group => {
            const widgets = availableWidgets.filter(w => w.group === group);
            if (!widgets.length) return null;

            const Icon = groupIcons[group] || BarChart2;

            return (
              <div key={group}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {groupLabels[group]}
                  </p>
                </div>

                <div className="space-y-1">
                  {widgets.map(widget => {
                    const visible = local.includes(widget.id);

                    return (
                      <div
                        key={widget.id}
                        onClick={() => toggle(widget.id)}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
                          visible
                            ? "border-primary/30 bg-primary/5"
                            : "border-border bg-background"
                        )}
                      >
                        <span className="text-sm font-medium">
                          {widget.label}
                        </span>

                        {visible ? (
                          <Eye className="w-4 h-4 text-primary" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-muted-foreground" />
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
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>

          <Button onClick={handleSave}>
            Save Layout
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}