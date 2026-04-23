import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { listUsers, inviteUser, resendInvite, updateUserProfile } from "@/api/users";
import { Mail, Pencil, RefreshCcw, Search, Shield, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";

const roles = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "recruiter", label: "Recruiter" },
  { value: "sales", label: "Sales" },
  { value: "hr", label: "HR" },
  { value: "workforce_manager", label: "Workforce Manager" },
  { value: "employee", label: "Employee" },
  { value: "viewer", label: "Viewer" },
];

const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;
const RESET_PASSWORD_URL = `${APP_URL}/reset-password`;

function roleLabel(value) {
  return roles.find((r) => r.value === value)?.label || value || "Unknown";
}

function statusTone(status) {
  if (status === "inactive") return "bg-red-50 text-red-700 border-red-200";
  if (status === "invited") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
}

function initials(nameOrEmail = "") {
  const value = String(nameOrEmail).trim();
  if (!value) return "U";

  const parts = value.split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  }

  return value.slice(0, 2).toUpperCase();
}

export default function UserManagement() {
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");

  const [inviteForm, setInviteForm] = useState({
    email: "",
    full_name: "",
    role: "employee",
    status: "active",
    manager_id: "",
  });

  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["users", user?.id],
    queryFn: () => listUsers(user),
    enabled: !!user?.id,
  });

  const managers = useMemo(() => {
    return users.filter((item) =>
      ["admin", "manager", "hr", "workforce_manager"].includes(item.role)
    );
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;

    return users.filter((item) =>
      [item.full_name, item.email, item.role, item.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [users, search]);

  const inviteMutation = useMutation({
    mutationFn: (payload) =>
      inviteUser(user, {
        ...payload,
        redirectTo: RESET_PASSWORD_URL,
      }),
    onSuccess: async () => {
      toast.success("Invitation email sent successfully.");
      setInviteOpen(false);
      setInviteForm({
        email: "",
        full_name: "",
        role: "employee",
        status: "active",
        manager_id: "",
      });
      await queryClient.invalidateQueries({ queryKey: ["users", user?.id] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to send invitation.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateUserProfile(id, payload, user),
    onSuccess: async () => {
      toast.success("User updated successfully.");
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: ["users", user?.id] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update user.");
    },
  });

  const resendInviteMutation = useMutation({
    mutationFn: (payload) =>
      resendInvite(user, {
        ...payload,
        redirectTo: RESET_PASSWORD_URL,
      }),
    onSuccess: async () => {
      toast.success("Invitation email re-sent.");
      await queryClient.invalidateQueries({ queryKey: ["users", user?.id] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to resend invitation.");
    },
  });

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status !== "inactive").length;
  const adminUsers = users.filter((u) => u.role === "admin").length;

  const submitInvite = (e) => {
    e.preventDefault();

    inviteMutation.mutate({
      email: inviteForm.email.trim(),
      full_name: inviteForm.full_name.trim(),
      role: inviteForm.role,
      status: inviteForm.status,
      manager_id: inviteForm.manager_id || null,
    });
  };

  const submitEdit = (e) => {
    e.preventDefault();
    if (!editing?.id) return;

    updateMutation.mutate({
      id: editing.id,
      payload: {
        full_name: editing.full_name?.trim() || "",
        role: editing.role,
        status: editing.status,
        manager_id: editing.manager_id || null,
      },
    });
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading users…</div>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error.message || "Failed to load users."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 px-4 py-6 text-white shadow-lg sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-blue-200">
              <Shield className="h-3.5 w-3.5" />
              User Administration
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight">User Management</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/70">
              Invite users by email, assign roles, set managers, and maintain access across
              your organization.
            </p>
          </div>

          <Button
            onClick={() => setInviteOpen(true)}
            className="w-full bg-white text-slate-900 hover:bg-slate-100 sm:w-auto"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Invite User
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wide text-slate-500">Total Users</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">{totalUsers}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wide text-slate-500">Active Users</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">{activeUsers}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wide text-slate-500">Admin Users</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">{adminUsers}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Organization Users</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Search, edit, and resend invitations for users in your organization.
              </p>
            </div>

            <div className="relative w-full lg:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              No users found.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((item) => {
                const manager = managers.find((m) => m.id === item.manager_id);

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 p-4 sm:p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <Avatar className="h-11 w-11 border border-slate-200">
                          <AvatarFallback className="bg-slate-100 text-slate-700">
                            {initials(item.full_name || item.email)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-900 sm:text-base">
                            {item.full_name || "Unnamed User"}
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                            <Mail className="h-3.5 w-3.5" />
                            <span className="break-all">{item.email}</span>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <Badge variant="outline" className="border-slate-200 text-slate-700">
                              {roleLabel(item.role)}
                            </Badge>
                            <Badge variant="outline" className={statusTone(item.status)}>
                              {item.status || "active"}
                            </Badge>
                            {manager ? (
                              <Badge variant="outline" className="border-slate-200 text-slate-700">
                                Manager: {manager.full_name || manager.email}
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {item.status === "invited" ? (
                          <Button
                            variant="outline"
                            onClick={() =>
                              resendInviteMutation.mutate({
                                email: item.email,
                                full_name: item.full_name,
                                role: item.role,
                                status: item.status,
                                manager_id: item.manager_id || null,
                              })
                            }
                            disabled={resendInviteMutation.isPending}
                          >
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            Resend Invite
                          </Button>
                        ) : null}

                        <Button
                          variant="outline"
                          onClick={() =>
                            setEditing({
                              id: item.id,
                              email: item.email || "",
                              full_name: item.full_name || "",
                              role: item.role || "employee",
                              status: item.status || "active",
                              manager_id: item.manager_id || "",
                            })
                          }
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
          </DialogHeader>

          <form onSubmit={submitInvite} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteForm.email}
                onChange={(e) =>
                  setInviteForm((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="name@company.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-name">Full Name</Label>
              <Input
                id="invite-name"
                value={inviteForm.full_name}
                onChange={(e) =>
                  setInviteForm((prev) => ({ ...prev, full_name: e.target.value }))
                }
                placeholder="Full name"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={inviteForm.role}
                  onValueChange={(value) =>
                    setInviteForm((prev) => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={inviteForm.status}
                  onValueChange={(value) =>
                    setInviteForm((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="invited">Invited</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Manager</Label>
              <Select
                value={inviteForm.manager_id || "none"}
                onValueChange={(value) =>
                  setInviteForm((prev) => ({
                    ...prev,
                    manager_id: value === "none" ? "" : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Manager</SelectItem>
                  {managers.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.full_name || manager.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              <div className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 text-slate-500" />
                <p>
                  The user will receive an email invitation with a password setup link.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setInviteOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={inviteMutation.isPending}>
                {inviteMutation.isPending ? "Sending..." : "Send Invite"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>

          {editing ? (
            <form onSubmit={submitEdit} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={editing.email} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={editing.full_name}
                  onChange={(e) =>
                    setEditing((prev) => ({ ...prev, full_name: e.target.value }))
                  }
                  placeholder="Full name"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={editing.role}
                    onValueChange={(value) =>
                      setEditing((prev) => ({ ...prev, role: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={editing.status}
                    onValueChange={(value) =>
                      setEditing((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="invited">Invited</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Manager</Label>
                <Select
                  value={editing.manager_id || "none"}
                  onValueChange={(value) =>
                    setEditing((prev) => ({
                      ...prev,
                      manager_id: value === "none" ? "" : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Manager</SelectItem>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.full_name || manager.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}