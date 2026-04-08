import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "../../lib/base44Stub";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  UserPlus, Settings, Shield, Mail, UserX, UserCheck, AlertTriangle,
  Users, ChevronRight, Copy, RotateCcw, KeyRound, Check, X
} from 'lucide-react';
import { MODULES, ROLE_DEFAULTS, ROLES } from '@/lib/permissions';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { toast } from 'sonner';

const SECTIONS = ['ATS', 'CRM', 'Workforce'];

const PERM_OPTIONS = [
  { value: 'none', label: 'No Access', color: 'text-slate-400' },
  { value: 'view', label: 'View All', color: 'text-sky-600' },
  { value: 'own', label: 'Own Only', color: 'text-amber-600' },
  { value: 'edit', label: 'Full Edit', color: 'text-emerald-600' },
];

const roleColors = {
  admin: 'bg-rose-50 text-rose-700 border-rose-200',
  manager: 'bg-violet-50 text-violet-700 border-violet-200',
  recruiter: 'bg-sky-50 text-sky-700 border-sky-200',
  sales: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  workforce_manager: 'bg-amber-50 text-amber-700 border-amber-200',
  employee: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  viewer: 'bg-slate-100 text-slate-500 border-slate-200',
};

function PermissionRow({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-lg border bg-background hover:bg-muted/30 transition-colors">
      <span className="text-sm font-medium">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-28 h-7 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PERM_OPTIONS.map(o => (
            <SelectItem key={o.value} value={o.value}>
              <span className={o.color}>{o.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SectionPermissions({ section, customPerms, roleDefaults, onPermChange, onApplySection }) {
  const mods = MODULES.filter(m => m.section === section);
  const sectionPerm = customPerms[`__section_${section}`] || '';

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{section}</p>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">Apply all:</span>
          {PERM_OPTIONS.map(o => (
            <button
              key={o.value}
              onClick={() => onApplySection(section, o.value)}
              className={`text-[10px] px-2 py-0.5 rounded border transition-colors hover:bg-muted ${o.color} border-border`}
              title={`Set all ${section} modules to "${o.label}"`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {mods.map(mod => {
          const effective = customPerms[mod.key] !== undefined ? customPerms[mod.key] : (roleDefaults[mod.key] || 'view');
          return (
            <PermissionRow
              key={mod.key}
              label={mod.label}
              value={effective}
              onChange={v => onPermChange(mod.key, v)}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function UserManagement() {
  const { user: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('users');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [permOpen, setPermOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('employee');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [customPerms, setCustomPerms] = useState({});
  const [filterStatus, setFilterStatus] = useState('active');
  const [filterRole, setFilterRole] = useState('all');
  const [groupEditRole, setGroupEditRole] = useState('employee');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: accessRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['access-requests'],
    queryFn: () => base44.entities.AccessRequest.list('-created_date'),
  });

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AccessRequest.update(id, data),
    onSuccess: (_, { data, userId, permKey, permValue }) => {
      queryClient.invalidateQueries({ queryKey: ['access-requests'] });
      if (data.status === 'approved' && userId && permKey) {
        // Also update the user's permissions
        const targetUser = users.find(u => u.email === data.requester_email);
        if (targetUser) {
          const updatedPerms = { ...(targetUser.permissions || {}), [permKey]: permValue };
          base44.entities.User.update(targetUser.id, { permissions: updatedPerms })
            .then(() => queryClient.invalidateQueries({ queryKey: ['users'] }));
        }
      }
      toast.success(data.status === 'approved' ? 'Request approved and access granted.' : 'Request rejected.');
    },
  });

  const handleApproveRequest = (req) => {
    updateRequestMutation.mutate({
      id: req.id,
      data: { status: 'approved', reviewed_by: currentUser?.full_name || currentUser?.email },
      permKey: req.module,
      permValue: req.access_level,
    });
  };

  const handleRejectRequest = (req, note = '') => {
    updateRequestMutation.mutate({
      id: req.id,
      data: { status: 'rejected', reviewed_by: currentUser?.full_name || currentUser?.email, review_notes: note },
    });
  };

  const pendingRequests = useMemo(() => accessRequests.filter(r => r.status === 'pending'), [accessRequests]);
  const MODULE_LABELS = Object.fromEntries(MODULES.map(m => [m.key, `${m.section} — ${m.label}`]));

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: (_, { data }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setPermOpen(false);
      setDeactivateOpen(false);
      if (data.status === 'deactivated') toast.success('User deactivated.');
      else if (data.status === 'active') toast.success('User reactivated.');
      else toast.success('Permissions saved.');
    },
  });

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviteLoading(true);
    try {
      const newUser = { email: inviteEmail, full_name: inviteEmail.split("@")[0], role: inviteRole, status: "active" };
        await base44.entities.User.create(newUser);
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteOpen(false);
      setInviteEmail('');
    } catch {
      toast.error('Failed to send invitation.');
    }
    setInviteLoading(false);
  };

  const openPermissions = (u) => {
    setSelectedUser({ ...u });
    setCustomPerms(u.permissions || {});
    setPermOpen(true);
  };

  const handlePermChange = (key, value) => {
    setCustomPerms(prev => ({ ...prev, [key]: value }));
  };

  const handleApplySection = (section, value) => {
    const mods = MODULES.filter(m => m.section === section);
    const updates = {};
    mods.forEach(m => { updates[m.key] = value; });
    setCustomPerms(prev => ({ ...prev, ...updates }));
    toast.success(`All ${section} modules set to "${value}"`);
  };

  const handleSavePermissions = () => {
    updateUserMutation.mutate({
      id: selectedUser.id,
      data: { role: selectedUser.role, permissions: customPerms },
    });
  };

  const handleResetToRole = () => {
    setCustomPerms({});
    toast.info('Reset to role defaults. Save to apply.');
  };

  const handleToggleStatus = (u, newStatus) => {
    updateUserMutation.mutate({ id: u.id, data: { status: newStatus } });
  };

  // Group edit: apply role defaults to all users in a group
  const handleGroupApply = () => {
    const targets = users.filter(u => u.role === groupEditRole && (u.status || 'active') === 'active' && u.email !== currentUser?.email);
    if (targets.length === 0) { toast.info('No users in that role group.'); return; }
    Promise.all(targets.map(u => base44.entities.User.update(u.id, { permissions: {} })))
      .then(() => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success(`Reset permissions for ${targets.length} ${groupEditRole} user(s) to role defaults.`); });
  };

  const filteredUsers = users.filter(u => {
    const matchStatus = filterStatus === 'all' || (u.status || 'active') === filterStatus;
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchStatus && matchRole;
  });

  const activeCount = users.filter(u => (u.status || 'active') === 'active').length;
  const deactivatedCount = users.filter(u => u.status === 'deactivated').length;

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Shield className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p className="text-lg font-medium">Access Restricted</p>
        <p className="text-sm">Only admins can manage users and permissions.</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1200px]">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">{activeCount} active · {deactivatedCount} deactivated</p>
        </div>
        <Button onClick={() => setInviteOpen(true)} className="gap-2">
          <UserPlus className="w-4 h-4" /> Invite User
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-5">
        <TabsList>
          <TabsTrigger value="users" className="gap-1.5"><Users className="w-3.5 h-3.5" />Team Members</TabsTrigger>
          <TabsTrigger value="roles" className="gap-1.5"><Shield className="w-3.5 h-3.5" />Role Groups</TabsTrigger>
          <TabsTrigger value="access_requests" className="gap-1.5"><KeyRound className="w-3.5 h-3.5" />Access Requests</TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === 'users' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex gap-1.5">
              {[
                { value: 'active', label: `Active (${activeCount})` },
                { value: 'deactivated', label: `Deactivated (${deactivatedCount})` },
                { value: 'all', label: `All (${users.length})` },
              ].map(tab => (
                <button key={tab.value} onClick={() => setFilterStatus(tab.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === tab.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
                  {tab.label}
                </button>
              ))}
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="h-8 w-[160px] text-xs">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader className="pb-3 border-b py-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {filteredUsers.length} member{filteredUsers.length !== 1 ? 's' : ''}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground"><Mail className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">No users found.</p></div>
              ) : (
                <div className="divide-y">
                  {filteredUsers.map(u => {
                    const isSelf = u.email === currentUser?.email;
                    const isDeactivated = u.status === 'deactivated';
                    const hasCustomPerms = Object.keys(u.permissions || {}).length > 0;
                    return (
                      <div key={u.id} className={`flex items-center justify-between px-5 py-3.5 hover:bg-muted/20 transition-colors ${isDeactivated ? 'opacity-55' : ''}`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className={`text-xs font-bold ${isDeactivated ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                              {u.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-sm font-semibold truncate">{u.full_name || 'Pending Signup'}</p>
                              {isSelf && <span className="text-[10px] text-muted-foreground">(you)</span>}
                              {isDeactivated && <span className="text-[10px] text-rose-500 font-medium">(deactivated)</span>}
                              {hasCustomPerms && <span className="text-[10px] text-violet-600 font-medium">• custom perms</span>}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className={`text-xs border ${roleColors[u.role] || roleColors.viewer}`}>
                            {u.role || 'viewer'}
                          </Badge>
                          {!isSelf && (
                            <>
                              {!isDeactivated && (
                                <Button size="sm" variant="outline" onClick={() => openPermissions(u)} className="gap-1 text-xs h-7">
                                  <Settings className="w-3 h-3" /> Edit
                                </Button>
                              )}
                              {isDeactivated ? (
                                <Button size="sm" variant="outline" onClick={() => handleToggleStatus(u, 'active')}
                                  className="gap-1 text-xs h-7 text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                                  <UserCheck className="w-3 h-3" /> Reactivate
                                </Button>
                              ) : (
                                <Button size="sm" variant="outline" onClick={() => { setSelectedUser(u); setDeactivateOpen(true); }}
                                  className="text-xs h-7 text-rose-600 border-rose-200 hover:bg-rose-50">
                                  <UserX className="w-3 h-3" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 'roles' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            View the default permissions for each role group. To customize an individual user, use the Team Members tab.
            You can also bulk-reset all users of a role back to their default permissions.
          </p>

          {/* Bulk reset group */}
          <Card className="p-4">
            <p className="text-sm font-semibold mb-3">Bulk Reset Group Permissions</p>
            <div className="flex items-center gap-3">
              <Select value={groupEditRole} onValueChange={setGroupEditRole}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.filter(r => r.value !== 'admin').map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleGroupApply} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Reset all {groupEditRole} users to defaults
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              This clears any custom permission overrides for all active users in the selected role, reverting them to the role's default access.
            </p>
          </Card>

          {/* Role permission matrix */}
          <div className="space-y-4">
            {ROLES.map(role => {
              const defaults = ROLE_DEFAULTS[role.value] || {};
              const usersInRole = users.filter(u => u.role === role.value && (u.status || 'active') === 'active');
              return (
                <Card key={role.value}>
                  <CardHeader className="py-3 pb-2 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs border ${roleColors[role.value]}`}>{role.label}</Badge>
                        <span className="text-xs text-muted-foreground">{role.desc}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{usersInRole.length} user{usersInRole.length !== 1 ? 's' : ''}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-3 pb-3">
                    <div className="grid grid-cols-3 gap-x-6 gap-y-1">
                      {SECTIONS.map(section => (
                        <div key={section}>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">{section}</p>
                          {MODULES.filter(m => m.section === section).map(mod => {
                            const perm = defaults[mod.key] || 'none';
                            const opt = PERM_OPTIONS.find(o => o.value === perm);
                            return (
                              <div key={mod.key} className="flex items-center justify-between py-0.5">
                                <span className="text-xs text-muted-foreground">{mod.label}</span>
                                <span className={`text-[10px] font-semibold ${opt?.color || 'text-slate-400'}`}>{opt?.label || perm}</span>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'access_requests' && (
        <div className="space-y-4">
          {/* Pending */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-semibold">Pending Requests</h2>
              {pendingRequests.length > 0 && (
                <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">{pendingRequests.length}</span>
              )}
            </div>
            {requestsLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : pendingRequests.length === 0 ? (
              <Card className="py-8 text-center">
                <KeyRound className="w-7 h-7 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No pending access requests.</p>
              </Card>
            ) : (
              pendingRequests.map(req => (
                <Card key={req.id} className="mb-3">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-sm font-semibold">{req.requester_name || req.requester_email}</p>
                          <span className="text-xs text-muted-foreground">{req.requester_email}</span>
                        </div>
                        <p className="text-sm text-foreground">
                          Requesting <strong>{req.access_level}</strong> access to <strong>{MODULE_LABELS[req.module] || req.module}</strong>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1.5 bg-muted rounded-lg px-3 py-2">"{req.reason}"</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button size="sm" onClick={() => handleApproveRequest(req)}
                          disabled={updateRequestMutation.isPending}
                          className="gap-1 h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                          <Check className="w-3 h-3" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleRejectRequest(req)}
                          disabled={updateRequestMutation.isPending}
                          className="gap-1 h-8 text-rose-600 border-rose-200 hover:bg-rose-50 text-xs">
                          <X className="w-3 h-3" /> Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* History */}
          {accessRequests.filter(r => r.status !== 'pending').length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3">History</h2>
              {accessRequests.filter(r => r.status !== 'pending').map(req => (
                <div key={req.id} className="flex items-center justify-between px-4 py-3 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-xs font-medium">{req.requester_name || req.requester_email} → {MODULE_LABELS[req.module] || req.module}</p>
                    <p className="text-[10px] text-muted-foreground">Reviewed by {req.reviewed_by}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${req.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Mail className="w-5 h-5 text-primary" /> Invite User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Email Address</Label>
              <Input type="email" placeholder="employee@company.com" value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleInvite()} />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.filter(r => r.value !== 'admin').map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label} — {r.desc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
              The user will receive an email invitation. Once they sign up, they'll have the selected role's permissions.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={!inviteEmail || inviteLoading} className="gap-2">
              <Mail className="w-4 h-4" />{inviteLoading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation */}
      <Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600"><AlertTriangle className="w-5 h-5" /> Deactivate User</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-1">
            Deactivate <strong>{selectedUser?.full_name || selectedUser?.email}</strong>? They will immediately lose all access.
          </p>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeactivateOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleToggleStatus(selectedUser, 'deactivated')}
              disabled={updateUserMutation.isPending}>
              {updateUserMutation.isPending ? 'Deactivating...' : 'Deactivate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      {selectedUser && (
        <Dialog open={permOpen} onOpenChange={setPermOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader className="shrink-0">
              <DialogTitle>Edit Permissions — {selectedUser.full_name || selectedUser.email}</DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto min-h-0 space-y-5 pr-1">
              {/* Role selector */}
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={selectedUser.role || 'viewer'} onValueChange={v => {
                  setSelectedUser(prev => ({ ...prev, role: v }));
                  setCustomPerms({});
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label} — {r.desc}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Changing role resets custom overrides. Customize module access below.</p>
              </div>

              {/* Section-by-section permissions */}
              {SECTIONS.map(section => (
                <SectionPermissions
                  key={section}
                  section={section}
                  customPerms={customPerms}
                  roleDefaults={ROLE_DEFAULTS[selectedUser.role] || ROLE_DEFAULTS.viewer}
                  onPermChange={handlePermChange}
                  onApplySection={handleApplySection}
                />
              ))}
            </div>

            <DialogFooter className="shrink-0 pt-3 border-t mt-2 flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleResetToRole} className="gap-1.5 text-muted-foreground mr-auto">
                <RotateCcw className="w-3.5 h-3.5" /> Reset to role defaults
              </Button>
              <Button variant="outline" onClick={() => setPermOpen(false)}>Cancel</Button>
              <Button onClick={handleSavePermissions} disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending ? 'Saving...' : 'Save Permissions'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}