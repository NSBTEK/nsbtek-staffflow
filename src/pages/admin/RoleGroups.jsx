import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import RecordFormModal from "@/components/shared/RecordFormModal";
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

function shallowEqualObjects(a = {}, b = {}) {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

export default function RoleGroups() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    is_active: true,
  });
  const [permissionDraft, setPermissionDraft] = useState({});

  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ["role-groups"],
    queryFn: listRoleGroups,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["profiles-list"],
    queryFn: listProfiles,
  });

  const { data: userRoleGroups = [] } = useQuery({
    queryKey: ["user-role-groups"],
    queryFn: listUserRoleGroups,
  });

  const { data: currentPermissions = [], isLoading: permissionsLoading } = useQuery({
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
    }
  }, [groups, selectedGroupId]);

  useEffect(() => {
    if (!selectedGroupId) return;

    setPermissionDraft((prev) => {
      if (shallowEqualObjects(prev, currentPermissionsMap)) {
        return prev;
      }
      return currentPermissionsMap;
    });
  }, [selectedGroupId, currentPermissionsMap]);

  const createMutation = useMutation({
    mutationFn: (payload) => createRoleGroup(payload, authUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-groups"] });
      resetForm();
      setOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateRoleGroup(id, payload, authUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-groups"] });
      resetForm();
      setOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRoleGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-groups"] });
      queryClient.invalidateQueries({ queryKey: ["current-user-profile"] });
      setSelectedGroupId(null);
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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["role-group-permissions", selectedGroupId],
      });
      queryClient.invalidateQueries({ queryKey: ["current-user-profile"] });
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ userId, roleGroupId }) =>
      assignRoleGroupToUser(userId, roleGroupId, authUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-role-groups"] });
      queryClient.invalidateQueries({ queryKey: ["current-user-profile"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: ({ userId, roleGroupId }) =>
      removeRoleGroupFromUser(userId, roleGroupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-role-groups"] });
      queryClient.invalidateQueries({ queryKey: ["current-user-profile"] });
    },
  });

  const resetForm = () => {
    setEditing(null);
    setForm({
      name: "",
      description: "",
      is_active: true,
    });
  };

  const openAdd = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (group) => {
    setEditing(group);
    setForm({
      name: group.name || "",
      description: group.description || "",
      is_active: !!group.is_active,
    });
    setOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editing) {
      updateMutation.mutate({
        id: editing.id,
        payload: form,
      });
    } else {
      createMutation.mutate(form);
    }
  };

  const selectedUsers = useMemo(() => {
    return userRoleGroups.filter((x) => x.role_group_id === selectedGroupId);
  }, [userRoleGroups, selectedGroupId]);

  const isAssigned = (userId) =>
    selectedUsers.some((x) => x.user_id === userId);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Role Groups</h1>
          <p className="text-muted-foreground">
            Create custom groups, assign module permissions, and attach groups to users.
          </p>
        </div>

        <button
          onClick={openAdd}
          className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 font-medium"
        >
          + Add Role Group
        </button>
      </div>

      <div className="grid lg:grid-cols-[360px,1fr] gap-6">
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b font-semibold">Role Groups</div>

          {groupsLoading ? (
            <div className="p-4 text-sm text-muted-foreground">Loading groups...</div>
          ) : groups.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No groups yet.</div>
          ) : (
            <div className="divide-y">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className={`p-4 ${selectedGroupId === group.id ? "bg-muted/40" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedGroupId(group.id)}
                      className="text-left flex-1"
                    >
                      <div className="font-medium">{group.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {group.description || "No description"}
                      </div>
                      <div className="text-[11px] mt-2">
                        {group.is_active ? (
                          <span className="text-green-600">Active</span>
                        ) : (
                          <span className="text-red-600">Inactive</span>
                        )}
                      </div>
                    </button>

                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(group)}
                        className="rounded-lg border px-3 py-1.5 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          const confirmed = window.confirm("Delete this role group?");
                          if (confirmed) deleteMutation.mutate(group.id);
                        }}
                        className="rounded-lg border border-red-200 text-red-600 px-3 py-1.5 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b font-semibold">
              Permissions {selectedGroupId ? "" : "(Select a group)"}
            </div>

            {!selectedGroupId ? (
              <div className="p-4 text-sm text-muted-foreground">
                Select a role group to manage permissions.
              </div>
            ) : permissionsLoading ? (
              <div className="p-4 text-sm text-muted-foreground">
                Loading permissions...
              </div>
            ) : (
              <div className="p-4 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {MODULES.map((module) => (
                    <div key={module} className="rounded-xl border p-3">
                      <div className="font-medium text-sm mb-2">{module}</div>
                      <select
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                        value={permissionDraft[module] || "none"}
                        onChange={(e) =>
                          setPermissionDraft((prev) => ({
                            ...prev,
                            [module]: e.target.value,
                          }))
                        }
                      >
                        {LEVELS.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => savePermissionsMutation.mutate()}
                    className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 font-medium"
                  >
                    Save Permissions
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b font-semibold">
              Assign Users {selectedGroupId ? "" : "(Select a group)"}
            </div>

            {!selectedGroupId ? (
              <div className="p-4 text-sm text-muted-foreground">
                Select a role group to assign users.
              </div>
            ) : (
              <div className="p-4 space-y-4">
                <div className="grid md:grid-cols-2 gap-3">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="rounded-xl border p-3 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-medium text-sm">
                          {user.full_name || user.email}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user.email} • {user.role}
                        </div>
                      </div>

                      {isAssigned(user.id) ? (
                        <button
                          onClick={() =>
                            removeMutation.mutate({
                              userId: user.id,
                              roleGroupId: selectedGroupId,
                            })
                          }
                          className="rounded-lg border border-red-200 text-red-600 px-3 py-1.5 text-sm"
                        >
                          Remove
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            assignMutation.mutate({
                              userId: user.id,
                              roleGroupId: selectedGroupId,
                            })
                          }
                          className="rounded-lg border px-3 py-1.5 text-sm"
                        >
                          Assign
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <RecordFormModal
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Edit Role Group" : "Add Role Group"}
      >
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div>
            <label className="block text-sm mb-1">Group Name</label>
            <input
              className="border rounded-lg px-3 py-2 w-full"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Description</label>
            <textarea
              className="border rounded-lg px-3 py-2 w-full"
              rows={4}
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!form.is_active}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, is_active: e.target.checked }))
              }
            />
            Active
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 text-white px-4 py-2"
            >
              {editing ? "Update Group" : "Save Group"}
            </button>
          </div>
        </form>
      </RecordFormModal>
    </div>
  );
}