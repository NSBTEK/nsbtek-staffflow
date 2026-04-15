import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getProfileOrThrow } from "@/lib/profile";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield, Pencil, Trash2, Copy, Plus, Search } from "lucide-react";

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
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
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

  const { data: currentProfile } = useQuery({
    queryKey: ["current-user-profile", authUser?.id],
    queryFn: () => getProfileOrThrow(authUser.id),
    enabled: !!authUser?.id,
  });

  const isAdmin = currentProfile?.role === "admin";

  const { data: groups = [], isLoading: groupsLoading, error: groupsError } = useQuery({
    queryKey: ["role-groups", authUser?.id],
    queryFn: () => listRoleGroups(authUser),
    enabled: !!authUser?.id,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["profiles-list", authUser?.id],
    queryFn: () => listProfiles(authUser),
    enabled: !!authUser?.id,
  });

  const { data: userRoleGroups = [] } = useQuery({
    queryKey: ["user-role-groups", authUser?.id],
    queryFn: () => listUserRoleGroups(authUser),
    enabled: !!authUser?.id,
  });

  const { data: currentPermissions = [] } = useQuery({
    queryKey: ["role-group-permissions", selectedGroupId],
    queryFn: () => listRoleGroupPermissions(selectedGroupId),
    enabled: !!selectedGroupId,
  });

  const currentPermissionsMap = useMemo(
    () => permissionsArrayToMap(currentPermissions),
    [currentPermissions]
  );

  useEffect(() => {
    if (!selectedGroupId && groups.length > 0) {
      setSelectedGroupId(groups[0].id);
    } else if (
      selectedGroupId &&
      groups.length > 0 &&
      !groups.some((g) => g.id === selectedGroupId)
    ) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  useEffect(() => {
    if (!selectedGroupId) return;
    setPermissionDraft(currentPermissionsMap);
  }, [selectedGroupId, currentPermissionsMap]);

  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === selectedGroupId) || null,
    [groups, selectedGroupId]
  );

  useEffect(() => {
    if (selectedGroup) {
      setEditForm({
        name: selectedGroup.name || "",
        description: selectedGroup.description || "",
        is_active: selectedGroup.is_active ?? true,
      });
    }
  }, [selectedGroup]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((group) =>
      [group.name, group.description]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [groups, search]);

  const groupAssignments = useMemo(() => {
    const map = {};
    userRoleGroups.forEach((row) => {
      map[row.user_id] = row.role_group_id;
    });
    return map;
  }, [userRoleGroups]);

  const assignmentRowsByUserId = useMemo(() => {
    const map = {};
    userRoleGroups.forEach((row) => {
      map[row.user_id] = row;
    });
    return map;
  }, [userRoleGroups]);

  const usersByBaseRole = useMemo(() => {
    const grouped = {};
    users.forEach((user) => {
      const role = user.role || "unassigned";
      if (!grouped[role]) grouped[role] = [];
      grouped[role].push(user);
    });
    return grouped;
  }, [users]);

  const refreshAssignments = async () => {
    await queryClient.invalidateQueries({ queryKey: ["user-role-groups", authUser?.id] });
    await queryClient.invalidateQueries({ queryKey: ["profiles-list", authUser?.id] });
  };

  const createMutation = useMutation({
    mutationFn: (payload) => createRoleGroup(payload, authUser),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["role-groups", authUser?.id] });
      setCreateForm({ name: "", description: "", is_active: true });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateRoleGroup(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["role-groups", authUser?.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRoleGroup,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["role-groups", authUser?.id] });
      setSelectedGroupId(null);
    },
  });

  const cloneMutation = useMutation({
    mutationFn: async () => {
      if (!selectedGroup) throw new Error("No role group selected");

      const group = await createRoleGroup(
        {
          name: `${selectedGroup.name} Copy`,
          description: selectedGroup.description || "",
          is_active: true,
        },
        authUser
      );

      await saveRoleGroupPermissions(
        group.id,
        MODULES.map((module_key) => ({
          module_key,
          permission_level: permissionDraft[module_key] || "none",
        })),
        authUser
      );

      return group;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["role-groups", authUser?.id] });
      await queryClient.invalidateQueries({ queryKey: ["role-group-permissions"] });
    },
  });

  const savePermissionsMutation = useMutation({
    mutationFn: () =>
      saveRoleGroupPermissions(
        selectedGroupId,
        MODULES.map((module_key) => ({
          module_key,
          permission_level: permissionDraft[module_key] || "none",
        })),
        authUser
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["role-group-permissions", selectedGroupId],
      });
    },
    onError: (error) => {
      alert(error.message || "Failed to save permissions");
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ userId, roleGroupId }) =>
      assignRoleGroupToUser(userId, roleGroupId, authUser),
    onSuccess: refreshAssignments,
    onError: (error) => {
      alert(error.message || "Failed to assign group");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (assignmentId) => removeRoleGroupFromUser(assignmentId),
    onSuccess: refreshAssignments,
    onError: (error) => {
      alert(error.message || "Failed to clear group");
    },
  });

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

  if (groupsLoading) {
    return <div className="text-sm text-slate-500">Loading role groups…</div>;
  }

  if (groupsError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {groupsError.message || "Failed to load role groups."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 px-6 py-6 text-white shadow-lg">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-blue-200">
            <Shield className="h-3.5 w-3.5" />
            Security Access
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Role Groups</h1>
          <p className="mt-2 max-w-3xl text-sm text-white/70">
            Create organization-specific role groups, control module access, and assign users to the correct group.
          </p>
          {!isAdmin ? (
            <p className="mt-3 text-sm text-amber-200">
              View only. Only admins can edit groups, permissions, or assignments.
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <SectionCard
          title="Organization Role Groups"
          subtitle="Create and manage reusable role groups for your organization."
          right={
            <div className="relative w-full max-w-[180px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search groups"
                className="pl-9"
              />
            </div>
          }
        >
          {isAdmin ? (
            <form onSubmit={handleCreate} className="mb-5 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-medium text-slate-900">Create Role Group</div>
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Group name"
              />
              <Input
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Description"
              />
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={createForm.is_active}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, is_active: e.target.checked }))
                  }
                />
                Active
              </label>
              <Button type="submit" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Create Group
              </Button>
            </form>
          ) : null}

          <div className="space-y-3">
            {filteredGroups.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                No groups found.
              </div>
            ) : (
              filteredGroups.map((group) => {
                const isSelected = selectedGroupId === group.id;

                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setSelectedGroupId(group.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? "border-blue-600 bg-blue-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-slate-900">{group.name}</div>
                        <div className="mt-1 text-sm text-slate-500">
                          {group.description || "No description"}
                        </div>
                      </div>
                      <div
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          group.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {group.is_active ? "Active" : "Inactive"}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard
            title="Selected Role Group"
            subtitle={
              selectedGroup
                ? "Edit this group and customize what it can access."
                : "Select a role group from the left."
            }
            right={
              selectedGroup && isAdmin ? (
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => cloneMutation.mutate()}>
                    <Copy className="mr-2 h-4 w-4" />
                    Clone
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => deleteMutation.mutate(selectedGroup.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              ) : null
            }
          >
            {selectedGroup ? (
              <form onSubmit={handleUpdate} className="space-y-4">
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Group name"
                  disabled={!isAdmin}
                />
                <Input
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Description"
                  disabled={!isAdmin}
                />
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={editForm.is_active}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, is_active: e.target.checked }))
                    }
                    disabled={!isAdmin}
                  />
                  Active
                </label>
                {isAdmin ? (
                  <Button type="submit">
                    <Pencil className="mr-2 h-4 w-4" />
                    Save Group
                  </Button>
                ) : null}
              </form>
            ) : (
              <div className="text-sm text-slate-500">Select a role group from the left.</div>
            )}
          </SectionCard>

          {selectedGroup ? (
            <SectionCard
              title="Module Permissions"
              subtitle="Choose exactly what this group can access."
              right={
                isAdmin ? (
                  <Button onClick={() => savePermissionsMutation.mutate()}>
                    Save Permissions
                  </Button>
                ) : null
              }
            >
              <div className="space-y-3">
                {MODULES.map((moduleKey) => (
                  <div key={moduleKey} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="font-medium capitalize text-slate-900">
                        {moduleKey.replaceAll("_", " ")}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {LEVELS.map((level) => (
                          <button
                            key={level}
                            type="button"
                            disabled={!isAdmin}
                            onClick={() =>
                              isAdmin &&
                              setPermissionDraft((prev) => ({ ...prev, [moduleKey]: level }))
                            }
                            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                              (permissionDraft[moduleKey] || "none") === level
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            } ${!isAdmin ? "cursor-not-allowed opacity-70" : ""}`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          ) : null}

          <SectionCard
            title="Organization Users by Base Role"
            subtitle="See what users exist by role and what role group they belong to."
          >
            <div className="space-y-6">
              {Object.entries(usersByBaseRole).map(([baseRole, roleUsers]) => (
                <div key={baseRole}>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                    {baseRole}
                  </h3>

                  <div className="space-y-3">
                    {roleUsers.map((user) => {
                      const currentRoleGroupId = groupAssignments[user.id];
                      const currentRoleGroup = groups.find((group) => group.id === currentRoleGroupId);
                      const assignedRow = assignmentRowsByUserId[user.id];

                      return (
                        <div
                          key={user.id}
                          className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between"
                        >
                          <div>
                            <div className="font-medium text-slate-900">
                              {user.full_name || user.email}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {user.email} · base role: {user.role} · group:{" "}
                              {currentRoleGroup?.name || "None"}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {groups.map((group) => {
                              const active = currentRoleGroupId === group.id;

                              return (
                                <button
                                  key={group.id}
                                  type="button"
                                  disabled={!isAdmin}
                                  onClick={() => {
                                    if (!isAdmin) return;
                                    if (active) return;
                                    assignMutation.mutate({
                                      userId: user.id,
                                      roleGroupId: group.id,
                                    });
                                  }}
                                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                                    active
                                      ? "border-blue-600 bg-blue-600 text-white"
                                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                  } ${!isAdmin ? "cursor-not-allowed opacity-70" : ""}`}
                                >
                                  {group.name}
                                </button>
                              );
                            })}

                            {isAdmin && assignedRow?.id ? (
                              <button
                                type="button"
                                onClick={() => removeMutation.mutate(assignedRow.id)}
                                className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                              >
                                Clear
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}