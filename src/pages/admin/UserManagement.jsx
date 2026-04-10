import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { listUsers, inviteUser, updateUserProfile } from "@/api/users";
import { toast } from "sonner";

const roles = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "recruiter", label: "Recruiter" },
  { value: "sales", label: "Sales" },
  { value: "workforce_manager", label: "Workforce Manager" },
  { value: "employee", label: "Employee" },
  { value: "viewer", label: "Viewer" },
];

export default function UserManagement() {
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    email: "",
    full_name: "",
    role: "viewer",
    status: "active",
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users", user?.id],
    queryFn: () => listUsers(user),
    enabled: !!user?.id,
  });

  const inviteMutation = useMutation({
    mutationFn: (payload) => inviteUser(user, payload),
    onSuccess: async () => {
      toast.success("Invitation sent");
      setOpen(false);
      setForm({ email: "", full_name: "", role: "viewer", status: "active" });
      await queryClient.invalidateQueries({ queryKey: ["users", user?.id] });
    },
    onError: (error) => toast.error(error.message || "Failed to invite user"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateUserProfile(id, payload, user),
    onSuccess: async () => {
      toast.success("User updated");
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: ["users", user?.id] });
    },
    onError: (error) => toast.error(error.message || "Failed to update user"),
  });

  const submitInvite = () => {
    if (!form.email.trim()) return toast.error("Email is required");
    inviteMutation.mutate(form);
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading users…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Invite and manage users from Supabase profiles.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>Invite User</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All users</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {users.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl border p-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {(item.full_name || item.email || "U").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{item.full_name || "Unnamed User"}</div>
                  <div className="text-sm text-muted-foreground">{item.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline">{item.role}</Badge>
                <Badge>{item.status || "active"}</Badge>
                <Button
                  variant="outline"
                  onClick={() => setEditing(item)}
                >
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite user</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input value={form.full_name} onChange={(e) => setForm((s) => ({ ...s, full_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(value) => setForm((s) => ({ ...s, role: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roles.map((role) => <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submitInvite} disabled={inviteMutation.isPending}>Send invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(value) => !value && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Full name</Label>
                <Input
                  value={editing.full_name || ""}
                  onChange={(e) => setEditing((s) => ({ ...s, full_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={editing.role} onValueChange={(value) => setEditing((s) => ({ ...s, role: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editing.status || "active"} onValueChange={(value) => setEditing((s) => ({ ...s, status: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button
              onClick={() => updateMutation.mutate({
                id: editing.id,
                payload: {
                  full_name: editing.full_name,
                  role: editing.role,
                  status: editing.status,
                },
              })}
              disabled={updateMutation.isPending}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
