import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { differenceInBusinessDays, parseISO } from "date-fns";

function buildInitialForm(initialData, user) {
  return (
    initialData || {
      employee_name: user?.full_name || "",
      employee_email: user?.email || "",
      leave_type: "vacation",
      start_date: "",
      end_date: "",
      reason: "",
      status: "pending",
      admin_notes: "",
    }
  );
}

export default function LeaveRequestDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  user,
  isAdmin,
  isSubmitting,
}) {
  const initialForm = useMemo(() => buildInitialForm(initialData, user), [initialData, user]);
  const [form, setForm] = useState(initialForm);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const calcDays = () => {
    if (form.start_date && form.end_date) {
      try {
        const d =
          differenceInBusinessDays(parseISO(form.end_date), parseISO(form.start_date)) + 1;
        return d > 0 ? d : 0;
      } catch {
        return 0;
      }
    }
    return 0;
  };

  const handleOpenChange = (nextOpen) => {
    if (nextOpen) {
      setForm(buildInitialForm(initialData, user));
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      total_days: calcDays(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Leave Request" : "New Leave Request"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Employee Name</Label>
            <Input
              value={form.employee_name || ""}
              onChange={(e) => set("employee_name", e.target.value)}
            />
          </div>

          <div>
            <Label>Employee Email</Label>
            <Input
              value={form.employee_email || ""}
              onChange={(e) => set("employee_email", e.target.value)}
            />
          </div>

          <div>
            <Label>Leave Type</Label>
            <Select
              value={form.leave_type || "vacation"}
              onValueChange={(value) => set("leave_type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vacation">Vacation</SelectItem>
                <SelectItem value="sick">Sick</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Start Date</Label>
            <Input
              type="date"
              value={form.start_date || ""}
              onChange={(e) => set("start_date", e.target.value)}
            />
          </div>

          <div>
            <Label>End Date</Label>
            <Input
              type="date"
              value={form.end_date || ""}
              onChange={(e) => set("end_date", e.target.value)}
            />
          </div>

          <div>
            <Label>Reason</Label>
            <Textarea
              value={form.reason || ""}
              onChange={(e) => set("reason", e.target.value)}
            />
          </div>

          {isAdmin ? (
            <div>
              <Label>Admin Notes</Label>
              <Textarea
                value={form.admin_notes || ""}
                onChange={(e) => set("admin_notes", e.target.value)}
              />
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}