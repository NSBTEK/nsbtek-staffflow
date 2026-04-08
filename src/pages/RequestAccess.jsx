import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "../lib/base44Stub";
import { useCurrentUser } from '@/lib/useCurrentUser';
import { canView } from '@/lib/permissions';
import { MODULES } from '@/lib/permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Lock, Send, Clock, CheckCircle, XCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const MODULE_LABELS = Object.fromEntries(MODULES.map(m => [m.key, `${m.section} — ${m.label}`]));

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
};
const statusIcons = { pending: Clock, approved: CheckCircle, rejected: XCircle };

export default function RequestAccess() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ module: '', access_level: 'view', reason: '' });

  const { data: myRequests = [], isLoading } = useQuery({
    queryKey: ['access-requests-mine'],
    queryFn: () => base44.entities.AccessRequest.list().then(data => data.filter(r => !user?.email || r.requester_email === user.email)),
    enabled: !!user?.email,
  });

  // Only show modules the user currently can't access
  const inaccessibleModules = MODULES.filter(m => !canView(user, m.key));

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AccessRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-requests-mine'] });
      setOpen(false);
      setForm({ module: '', access_level: 'view', reason: '' });
      toast.success('Access request submitted. Your manager will review it shortly.');
    },
  });

  const handleSubmit = () => {
    if (!form.module || !form.reason.trim()) { toast.error('Please select a module and provide a reason.'); return; }
    createMutation.mutate({
      ...form,
      requester_email: user?.email,
      requester_name: user?.full_name,
      status: 'pending',
    });
  };

  // Already-pending modules (don't allow duplicate requests)
  const pendingModules = new Set(myRequests.filter(r => r.status === 'pending').map(r => r.module));

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Request Access</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Request access to platform modules from your manager or admin.
          </p>
        </div>
        {inaccessibleModules.length > 0 && (
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> New Request
          </Button>
        )}
      </div>

      {/* Current access summary */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Your Current Access</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {MODULES.map(m => {
              const hasAccess = canView(user, m.key);
              return (
                <div key={m.key} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${hasAccess ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-muted text-muted-foreground border-border'}`}>
                  {hasAccess ? <CheckCircle className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  {m.label}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* My requests */}
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">My Requests</h2>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : myRequests.length === 0 ? (
        <Card className="py-10 text-center">
          <Lock className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No access requests yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {[...myRequests].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).map(req => {
            const Icon = statusIcons[req.status] || Clock;
            return (
              <Card key={req.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">{MODULE_LABELS[req.module] || req.module}</span>
                      <Badge variant="outline" className={`text-[10px] border ${statusStyles[req.status]}`}>
                        <Icon className="w-3 h-3 mr-1" />
                        {req.status}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">{req.access_level} access</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">Reason: {req.reason}</p>
                    {req.review_notes && (
                      <p className="text-xs mt-1.5 p-2 bg-muted rounded-lg">
                        <span className="font-medium">Response:</span> {req.review_notes}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      {req.created_date ? formatDistanceToNow(new Date(req.created_date), { addSuffix: true }) : ''}
                      {req.reviewed_by && ` · Reviewed by ${req.reviewed_by}`}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Request Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" /> Request Module Access
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Module</Label>
              <Select value={form.module} onValueChange={v => setForm(p => ({ ...p, module: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a module..." />
                </SelectTrigger>
                <SelectContent>
                  {inaccessibleModules.map(m => (
                    <SelectItem key={m.key} value={m.key} disabled={pendingModules.has(m.key)}>
                      {MODULE_LABELS[m.key]}{pendingModules.has(m.key) ? ' (pending)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Access Level Needed</Label>
              <Select value={form.access_level} onValueChange={v => setForm(p => ({ ...p, access_level: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View Only</SelectItem>
                  <SelectItem value="edit">Full Edit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Reason for Request</Label>
              <Textarea
                placeholder="Explain why you need access to this module..."
                value={form.reason}
                onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending} className="gap-2">
              <Send className="w-4 h-4" />
              {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}