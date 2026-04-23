import { supabase } from "@/lib/supabaseClient";
import { getProfileOrThrow } from "@/lib/profile";
import {
  assertCanEditModule,
  buildScopedWriteQuery,
} from "@/lib/moduleAccess";
import {
  hasHRAdminOnlyAccess,
  buildWorkforceScopedListQuery,
  buildHRAdminOnlyListQuery,
} from "@/lib/workforceAccess";

function sanitizePayload(payload = {}, allowedKeys = []) {
  if (!Array.isArray(allowedKeys) || allowedKeys.length === 0) {
    return { ...payload };
  }

  const next = {};
  for (const key of allowedKeys) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      next[key] = payload[key];
    }
  }
  return next;
}

async function assertHRAdminOnlyModuleAccess(currentUser, moduleKey = "onboarding") {
  const profile = await getProfileOrThrow(currentUser.id);

  if (!hasHRAdminOnlyAccess(profile)) {
    throw new Error("You do not have access to this module.");
  }

  return profile;
}

async function buildWorkforceScopedWriteQuery({
  query,
  currentUser,
  module,
  employeeColumn = "employee_id",
  orgColumn = "organization_id",
}) {
  const profile = await getProfileOrThrow(currentUser.id);

  assertCanEditModule(profile, module);

  return buildScopedWriteQuery(query, profile, module, {
    orgColumn,
    ownerColumn: employeeColumn,
    userId: currentUser.id,
    organizationId: profile.organization_id,
  });
}

async function buildHRAdminOnlyWriteQuery({
  query,
  currentUser,
  orgColumn = "organization_id",
  moduleKey = "onboarding",
}) {
  const profile = await assertHRAdminOnlyModuleAccess(currentUser, moduleKey);
  return query.eq(orgColumn, profile.organization_id);
}

async function writeAuditLog({
  currentUser,
  moduleKey,
  tableName,
  recordId,
  action,
  beforeData = null,
  afterData = null,
}) {
  try {
    const profile = await getProfileOrThrow(currentUser.id);

    const payload = {
      organization_id: profile.organization_id ?? null,
      actor_user_id: currentUser.id ?? null,
      module: moduleKey,
      action,
      entity_type: tableName,
      entity_id: recordId ?? null,
      metadata: {
        before: beforeData,
        after: afterData,
      },
    };

    const { error } = await supabase.from("audit_logs").insert(payload);

    if (error) {
      console.warn("Audit log write skipped:", error.message);
    }
  } catch (error) {
    console.warn("Audit log write failed:", error);
  }
}

export async function listWorkforceRows({
  table,
  module,
  currentUser,
  select = "*",
  orderBy = "created_at",
  ascending = false,
  employeeColumn = "employee_id",
  orgColumn = "organization_id",
}) {
  if (!table) throw new Error("Table is required");
  if (!module) throw new Error("Module is required");
  if (!currentUser?.id) throw new Error("Current user is required");

  let query = supabase.from(table).select(select).order(orderBy, { ascending });

  query = await buildWorkforceScopedListQuery({
    query,
    currentUser,
    module,
    employeeColumn,
    orgColumn,
  });

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createWorkforceRow({
  table,
  module,
  payload,
  currentUser,
  allowedKeys,
  employeeColumn = "employee_id",
  orgColumn = "organization_id",
}) {
  if (!table) throw new Error("Table is required");
  if (!module) throw new Error("Module is required");
  if (!currentUser?.id) throw new Error("Current user is required");

  const profile = await getProfileOrThrow(currentUser.id);
  assertCanEditModule(profile, module);

  const cleanPayload = sanitizePayload(payload, allowedKeys);

  const insertPayload = {
    ...cleanPayload,
    [orgColumn]: profile.organization_id,
    created_by: currentUser.id,
    updated_by: currentUser.id,
  };

  if (!insertPayload[employeeColumn]) {
    insertPayload[employeeColumn] = currentUser.id;
  }

  const { data, error } = await supabase
    .from(table)
    .insert(insertPayload)
    .select()
    .single();

  if (error) throw error;

  await writeAuditLog({
    currentUser,
    moduleKey: module,
    tableName: table,
    recordId: data.id,
    action: "create",
    afterData: data,
  });

  return data;
}

export async function updateWorkforceRow({
  table,
  module,
  id,
  payload,
  currentUser,
  allowedKeys,
  employeeColumn = "employee_id",
  orgColumn = "organization_id",
}) {
  if (!table) throw new Error("Table is required");
  if (!module) throw new Error("Module is required");
  if (!id) throw new Error("Row id is required");
  if (!currentUser?.id) throw new Error("Current user is required");

  const cleanPayload = sanitizePayload(payload, allowedKeys);

  const { data: beforeData, error: beforeError } = await supabase
    .from(table)
    .select("*")
    .eq("id", id)
    .single();

  if (beforeError) throw beforeError;

  let query = supabase
    .from(table)
    .update({
      ...cleanPayload,
      updated_by: currentUser.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  query = await buildWorkforceScopedWriteQuery({
    query,
    currentUser,
    module,
    employeeColumn,
    orgColumn,
  });

  const { data, error } = await query.select().single();
  if (error) throw error;

  await writeAuditLog({
    currentUser,
    moduleKey: module,
    tableName: table,
    recordId: data.id,
    action: "update",
    beforeData,
    afterData: data,
  });

  return data;
}

export async function deleteWorkforceRow({
  table,
  module,
  id,
  currentUser,
  employeeColumn = "employee_id",
  orgColumn = "organization_id",
}) {
  if (!table) throw new Error("Table is required");
  if (!module) throw new Error("Module is required");
  if (!id) throw new Error("Row id is required");
  if (!currentUser?.id) throw new Error("Current user is required");

  const { data: beforeData, error: beforeError } = await supabase
    .from(table)
    .select("*")
    .eq("id", id)
    .single();

  if (beforeError) throw beforeError;

  let query = supabase.from(table).delete().eq("id", id);

  query = await buildWorkforceScopedWriteQuery({
    query,
    currentUser,
    module,
    employeeColumn,
    orgColumn,
  });

  const { error } = await query;
  if (error) throw error;

  await writeAuditLog({
    currentUser,
    moduleKey: module,
    tableName: table,
    recordId: id,
    action: "delete",
    beforeData,
    afterData: null,
  });

  return true;
}

export async function listHRAdminOnlyRows({
  table,
  module,
  currentUser,
  select = "*",
  orderBy = "created_at",
  ascending = false,
  orgColumn = "organization_id",
}) {
  if (!table) throw new Error("Table is required");
  if (!module) throw new Error("Module is required");
  if (!currentUser?.id) throw new Error("Current user is required");

  let query = supabase.from(table).select(select).order(orderBy, { ascending });

  query = await buildHRAdminOnlyListQuery({
    query,
    currentUser,
    orgColumn,
    moduleKey: module,
  });

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createHRAdminOnlyRow({
  table,
  module,
  payload,
  currentUser,
  allowedKeys,
  orgColumn = "organization_id",
}) {
  if (!table) throw new Error("Table is required");
  if (!module) throw new Error("Module is required");
  if (!currentUser?.id) throw new Error("Current user is required");

  const profile = await assertHRAdminOnlyModuleAccess(currentUser, module);
  const cleanPayload = sanitizePayload(payload, allowedKeys);

  const { data, error } = await supabase
    .from(table)
    .insert({
      ...cleanPayload,
      [orgColumn]: profile.organization_id,
      created_by: currentUser.id,
      updated_by: currentUser.id,
    })
    .select()
    .single();

  if (error) throw error;

  await writeAuditLog({
    currentUser,
    moduleKey: module,
    tableName: table,
    recordId: data.id,
    action: "create",
    afterData: data,
  });

  return data;
}

export async function updateHRAdminOnlyRow({
  table,
  module,
  id,
  payload,
  currentUser,
  allowedKeys,
  orgColumn = "organization_id",
}) {
  if (!table) throw new Error("Table is required");
  if (!module) throw new Error("Module is required");
  if (!id) throw new Error("Row id is required");
  if (!currentUser?.id) throw new Error("Current user is required");

  const cleanPayload = sanitizePayload(payload, allowedKeys);

  const { data: beforeData, error: beforeError } = await supabase
    .from(table)
    .select("*")
    .eq("id", id)
    .single();

  if (beforeError) throw beforeError;

  let query = supabase
    .from(table)
    .update({
      ...cleanPayload,
      updated_by: currentUser.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  query = await buildHRAdminOnlyWriteQuery({
    query,
    currentUser,
    orgColumn,
    moduleKey: module,
  });

  const { data, error } = await query.select().single();
  if (error) throw error;

  await writeAuditLog({
    currentUser,
    moduleKey: module,
    tableName: table,
    recordId: data.id,
    action: "update",
    beforeData,
    afterData: data,
  });

  return data;
}

export async function deleteHRAdminOnlyRow({
  table,
  module,
  id,
  currentUser,
  orgColumn = "organization_id",
}) {
  if (!table) throw new Error("Table is required");
  if (!module) throw new Error("Module is required");
  if (!id) throw new Error("Row id is required");
  if (!currentUser?.id) throw new Error("Current user is required");

  const { data: beforeData, error: beforeError } = await supabase
    .from(table)
    .select("*")
    .eq("id", id)
    .single();

  if (beforeError) throw beforeError;

  let query = supabase.from(table).delete().eq("id", id);

  query = await buildHRAdminOnlyWriteQuery({
    query,
    currentUser,
    orgColumn,
    moduleKey: module,
  });

  const { error } = await query;
  if (error) throw error;

  await writeAuditLog({
    currentUser,
    moduleKey: module,
    tableName: table,
    recordId: id,
    action: "delete",
    beforeData,
    afterData: null,
  });

  return true;
}