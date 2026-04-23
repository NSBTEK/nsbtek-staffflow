import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignRoleGroupToUser,
  createRoleGroup,
  deleteRoleGroup,
  listProfiles,
  listRoleGroupPermissions,
  listRoleGroups,
  listUserRoleGroups,
  removeRoleGroupFromUser,
  saveRoleGroupPermissions,
  updateRoleGroup,
} from "@/api/roleGroups";
import { useAuth } from "@/lib/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Pencil,
  Trash2,
  Copy,
  Plus,
  Search,
  Users,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

const MODULES = [
  "dashboard",
  "clients",
  "contacts",
  "activities",
  "jobs",
  "candidates",
  "submissions",
  "interviews",
  "placements",
  "timesheets",
  "expenses",
  "contracts",
  "onboarding",
  "payroll",
  "ai_assistant",
  "resume_parser",
  "client_billing",
  "request_access",
  "users",
  "columns",
  "integrations",
  "audit_logs",
];

const LEVELS = ["none", "view", "edit", "own", "view_own"];

function permissionsArrayToMap(rows = []) {
  const next = {};
  rows.forEach((row) => {
    next[row.module_key] = row.permission_level;
  });
  return next;
}

function SectionCard({ title, subtitle, children, right }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {right}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">{text}</div>;
}

export default function RoleGroups() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();

  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [search, setSearch] = useState("");
  const [permissionDraft, setPermissionDraft] = useState({});
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    is_active: true,
  });
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    is_active: true,
  });
  const [selectedUserId, setSelectedUserId] = useState("");

  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ["role-groups", authUser?.id],
    queryFn: () => listRoleGroups(authUser),
    enabled: !!authUser?.id,
  });

  const activeSelectedGroupId = selectedGroupId || groups[0]?.id || null;

  const { data: permissionRows = [] } = useQuery({
    queryKey: ["role-group-permissions", activeSelectedGroupId],
    queryFn: () => listRoleGroupPermissions(activeSelectedGroupId, authUser),
    enabled: !!activeSelectedGroupId && !!authUser?.id,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-for-role-groups", authUser?.id],
    queryFn: () => listProfiles(authUser),
    enabled: !!authUser?.id,
  });

  const { data: userRoleGroups = [] } = useQuery({
    queryKey: ["user-role-groups", authUser?.id],
    queryFn: () => listUserRoleGroups(authUser),
    enabled: !!authUser?.id,
  });

  const currentPermissionsMap = useMemo(
    () => permissionsArrayToMap(permissionRows),
    [permissionRows]
  );

  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === activeSelectedGroupId) || null,
    [groups, activeSelectedGroupId]
  );

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((group) =>
      [group.name, group.description]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [groups, search]);

  const userGroupsByUserId = useMemo(() => {
    const map = {};
    userRoleGroups.forEach((row) => {
      if (!map[row.user_id]) map[row.user_id] = [];
      map[row.user_id].push(row);
    });
    return map;
  }, [userRoleGroups]);

  const selectableProfiles = useMemo(() => {
    return profiles.map((profile) => ({
      value: profile.id,
      label: profile.full_name || profile.email || profile.id,
      description: `${profile.role || "user"}${profile.email ? ` • ${profile.email}` : ""}`,
    }));
  }, [profiles]);

  const createMutation = useMutation({
    mutationFn: (payload) => createRoleGroup(payload, authUser),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ["role-groups", authUser?.id] });
      if (created?.id) {
        setSelectedGroupId(created.id);
        setEditForm({
          name: created.name || "",
          description: created.description || "",
          is_active: created.is_active ?? true,
        });
        setPermissionDraft({});
      }
      setCreateForm({ name: "", description: "", is_active: true });
      toast.success("Role group created");
    },
    onError: (err) => toast.error(err?.message || "Failed to create role group"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateRoleGroup(id, payload, authUser),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["role-groups", authUser?.id] });
      toast.success("Role group updated");
    },
    onError: (err) => toast.error(err?.message || "Failed to update role group"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteRoleGroup(id, authUser),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["role-groups", authUser?.id] });
      setSelectedGroupId(null);
      setEditForm({ name: "", description: "", is_active: true });
      setPermissionDraft({});
      toast.success("Role group deleted");
    },
    onError: (err) => toast.error(err?.message || "Failed to delete role group"),
  });

  const permissionsMutation = useMutation({
  mutationFn: ({ roleGroupId, permissions }) =>
    saveRoleGroupPermissions(roleGroupId, permissions, authUser),
  onSuccess: async () => {
    await queryClient.invalidateQueries({
      queryKey: ["role-group-permissions", activeSelectedGroupId],
    });
    await queryClient.invalidateQueries({ queryKey: ["current-user-profile"] });
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Permissions saved");
  },
  onError: (err) => toast.error(err?.message || "Failed to save permissions"),
});

  const assignMutation = useMutation({
  mutationFn: ({ userId, roleGroupId }) =>
    assignRoleGroupToUser(userId, roleGroupId, authUser),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ["user-role-groups", authUser?.id] });
    await queryClient.invalidateQueries({ queryKey: ["current-user-profile"] });
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
    setSelectedUserId("");
    toast.success("Role group assigned");
  },
  onError: (err) => toast.error(err?.message || "Failed to assign role group"),
});

  const removeMutation = useMutation({
  mutationFn: (assignmentId) => removeRoleGroupFromUser(assignmentId, authUser),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ["user-role-groups", authUser?.id] });
    await queryClient.invalidateQueries({ queryKey: ["current-user-profile"] });
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Role group removed");
  },
  onError: (err) => toast.error(err?.message || "Failed to remove role group"),
});

  const handleSelectGroup = (group) => {
    setSelectedGroupId(group.id);
    setEditForm({
      name: group.name || "",
      description: group.description || "",
      is_active: group.is_active ?? true,
    });
    setPermissionDraft(permissionsArrayToMap(permissionRows));
  };

  const handleCreate = (e) => {
    e.preventDefault();
    createMutation.mutate(createForm);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!selectedGroup?.id) return;
    updateMutation.mutate({
      id: selectedGroup.id,
      payload: editForm,
    });
  };

  const handleTogglePermission = (moduleKey, level) => {
    setPermissionDraft((prev) => ({
      ...prev,
      [moduleKey]: level,
    }));
  };

  const handleSavePermissions = () => {
    if (!activeSelectedGroupId) return;

    const permissions = MODULES.map((moduleKey) => ({
      module_key: moduleKey,
      permission_level:
        permissionDraft[moduleKey] ??
        currentPermissionsMap[moduleKey] ??
        "none",
    }));

    permissionsMutation.mutate({
      roleGroupId: activeSelectedGroupId,
      permissions,
    });
  };

  const handleAssign = () => {
    if (!selectedUserId || !activeSelectedGroupId) return;
    assignMutation.mutate({
      userId: selectedUserId,
      roleGroupId: activeSelectedGroupId,
    });
  };

  const handleCopyPermissions = () => {
    const permissionText = MODULES.map((moduleKey) => {
      const level =
        permissionDraft[moduleKey] ??
        currentPermissionsMap[moduleKey] ??
        "none";
      return `${moduleKey}: ${level}`;
    }).join("\n");

    navigator.clipboard.writeText(permissionText);
    toast.success("Permissions copied");
  };

  if (groupsLoading) {
    return (
      <AppLayout>
        <div className="text-sm text-slate-500">Loading role groups...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="grid gap-6 xl:grid-cols-[320px,1fr]">
        <div className="space-y-6">
          <SectionCard
            title="Role Groups"
            subtitle="Search and select a role group"
            right={<Shield className="h-5 w-5 text-slate-400" />}
          >
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search role groups"
                className="pl-9"
              />
            </div>

            <div className="space-y-2">
              {filteredGroups.length === 0 ? (
                <EmptyState text="No role groups found." />
              ) : (
                filteredGroups.map((group) => {
                  const active = group.id === activeSelectedGroupId;
                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => handleSelectGroup(group)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        active
                          ? "border-slate-900 bg-slate-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-slate-900">{group.name}</div>
                          <div className="mt-1 text-sm text-slate-500">
                            {group.description || "No description"}
                          </div>
                        </div>
                        {group.is_active ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Create Role Group"
            subtitle="Add a new permission bundle"
            right={<Plus className="h-5 w-5 text-slate-400" />}
          >
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Role group name"
              />
              <Input
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Description"
              />
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={!!createForm.is_active}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      is_active: e.target.checked,
                    }))
                  }
                />
                Active
              </label>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Group"}
              </Button>
            </form>
          </SectionCard>
        </div>

        <div className="space-y-6">
          {!selectedGroup ? (
            <SectionCard title="Role Group Details" subtitle="Choose a role group to continue">
              <EmptyState text="Select a role group from the left to edit permissions and assignments." />
            </SectionCard>
          ) : (
            <>
              <SectionCard
                title="Edit Role Group"
                subtitle="Update group name and description"
                right={
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setEditForm({
                          name: selectedGroup.name || "",
                          description: selectedGroup.description || "",
                          is_active: selectedGroup.is_active ?? true,
                        })
                      }
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Reset
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => deleteMutation.mutate(selectedGroup.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                }
              >
                <form onSubmit={handleUpdate} className="grid gap-4 md:grid-cols-2">
                  <Input
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Role group name"
                  />
                  <Input
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Description"
                  />
                  <label className="flex items-center gap-2 text-sm text-slate-600 md:col-span-2">
                    <input
                      type="checkbox"
                      checked={!!editForm.is_active}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          is_active: e.target.checked,
                        }))
                      }
                    />
                    Active
                  </label>
                  <div className="md:col-span-2">
                    <Button type="submit" disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </SectionCard>

              <SectionCard
                title="Permissions"
                subtitle="Set module access levels for this group"
                right={
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCopyPermissions}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                    <Button
                      onClick={handleSavePermissions}
                      disabled={permissionsMutation.isPending}
                    >
                      {permissionsMutation.isPending ? "Saving..." : "Save Permissions"}
                    </Button>
                  </div>
                }
              >
                <div className="grid gap-3">
                  {MODULES.map((moduleKey) => {
                    const selectedLevel =
                      permissionDraft[moduleKey] ??
                      currentPermissionsMap[moduleKey] ??
                      "none";

                    return (
                      <div
                        key={moduleKey}
                        className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between"
                      >
                        <div>
                          <div className="font-medium text-slate-900">{moduleKey}</div>
                          <div className="text-xs text-slate-500">
                            Configure access for this module
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {LEVELS.map((level) => {
                            const active = selectedLevel === level;
                            return (
                              <button
                                key={level}
                                type="button"
                                onClick={() => handleTogglePermission(moduleKey, level)}
                                className={`rounded-xl border px-3 py-1.5 text-sm ${
                                  active
                                    ? "border-slate-900 bg-slate-900 text-white"
                                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                {level}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>

              <SectionCard
                title="User Assignments"
                subtitle="Assign this role group to users"
                right={<Users className="h-5 w-5 text-slate-400" />}
              >
                <div className="flex flex-col gap-3 md:flex-row">
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-sm"
                  >
                    <option value="">Select user</option>
                    {selectableProfiles.map((profile) => (
                      <option key={profile.value} value={profile.value}>
                        {profile.label}
                      </option>
                    ))}
                  </select>

                  <Button onClick={handleAssign} disabled={!selectedUserId || assignMutation.isPending}>
                    {assignMutation.isPending ? "Assigning..." : "Assign Group"}
                  </Button>
                </div>

                <div className="mt-6 space-y-3">
                  {profiles.length === 0 ? (
                    <EmptyState text="No users available." />
                  ) : (
                    profiles.map((profile) => {
                      const assignments = userGroupsByUserId[profile.id] || [];
                      const matchingAssignments = assignments.filter(
                        (a) => a.role_group_id === activeSelectedGroupId
                      );

                      return (
                        <div
                          key={profile.id}
                          className="rounded-2xl border border-slate-200 p-4"
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                              <div className="font-medium text-slate-900">
                                {profile.full_name || profile.email || profile.id}
                              </div>
                              <div className="text-sm text-slate-500">
                                {profile.email || "No email"} {profile.role ? `• ${profile.role}` : ""}
                              </div>
                            </div>

                            {matchingAssignments.length === 0 ? (
                              <div className="text-sm text-slate-400">Not assigned</div>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {matchingAssignments.map((assignment) => (
                                  <div
                                    key={assignment.id}
                                    className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5 text-sm"
                                  >
                                    <span>{selectedGroup.name}</span>
                                    <button
                                      type="button"
                                      onClick={() => removeMutation.mutate(assignment.id)}
                                      className="text-red-600"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </SectionCard>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}