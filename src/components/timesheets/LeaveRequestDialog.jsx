import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { differenceInBusinessDays, parseISO } from 'date-fns';

export default function LeaveRequestDialog({ open, onOpenChange, onSubmit, initialData, user, isAdmin, isSubmitting }) {
  const [form, setForm] = useState({});

  useEffect(() => {
    if (open) {
      setForm(initialData || {
        employee_name: user?.full_name || '',
        employee_email: user?.email || '',
        leave_type: 'vacation',
        start_date: '',
        end_date: '',
        reason: '',
        status: 'pending',
        admin_notes: '',
      });
    }
  }, [open, initialData, user]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const calcDays = () => {
    if (form.start_date && form.end_date) {
      try {
        const d = differenceInBusinessDays(parseISO(form.end_date), parseISO(form.start_date)) + 1;
        return d > 0 ? d : 0;
      } catch { return 0; }
    }
    return 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, days: calcDays() });
  };

  const leaveTypes = ['vacation', 'sick', 'personal', 'maternity', 'paternity', 'unpaid', 'other'];
  const days = calcDays();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Leave Request' : 'Apply for Leave'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {isAdmin && (
            <>
              <div className="space-y-1.5">
                <Label>Employee Name</Label>
                <Input value={form.employee_name || ''} onChange={e => set('employee_name', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Employee Email</Label>
                <Input type="email" value={form.employee_email || ''} onChange={e => set('employee_email', e.target.value)} />
              </div>
            </>
          )}
          <div className="space-y-1.5">
            <Label>Leave Type</Label>
            <Select value={form.leave_type || 'vacation'} onValueChange={v => set('leave_type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {leaveTypes.map(t => (
                  <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <Input type="date" value={form.start_date || ''} onChange={e => set('start_date', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>End Date</Label>
              <Input type="date" value={form.end_date || ''} onChange={e => set('end_date', e.target.value)} required />
            </div>
          </div>
          {days > 0 && (
            <p className="text-sm text-muted-foreground bg-muted rounded-lg px-3 py-2">
              📅 <strong>{days}</strong> business day{days !== 1 ? 's' : ''}
            </p>
          )}
          <div className="space-y-1.5">
            <Label>Reason</Label>
            <Textarea value={form.reason || ''} onChange={e => set('reason', e.target.value)} rows={2} placeholder="Brief reason..." />
          </div>
          {isAdmin && (
            <>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status || 'pending'} onValueChange={v => set('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['pending', 'approved', 'rejected', 'cancelled'].map(s => (
                      <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Admin Notes</Label>
                <Textarea value={form.admin_notes || ''} onChange={e => set('admin_notes', e.target.value)} rows={2} placeholder="Internal notes..." />
              </div>
            </>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (initialData ? 'Update' : 'Submit Request')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}