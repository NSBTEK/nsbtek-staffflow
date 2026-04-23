import { supabase } from "@/lib/supabaseClient";
import { writeAuditLog } from "@/lib/auditLog";
import {
  createModuleRow,
  updateModuleRow,
  deleteModuleRow,
} from "@/lib/supabaseCrud";

export async function createAuditedModuleRow(args) {
  const created = await createModuleRow(args);

  await writeAuditLog({
    currentUser: args.currentUser,
    moduleKey: args.module,
    tableName: args.table,
    recordId: created.id,
    action: "create",
    beforeData: null,
    afterData: created,
    metadata: {},
  });

  return created;
}

export async function updateAuditedModuleRow(args) {
  const { table, id } = args;

  const { data: beforeData, error: beforeError } = await supabase
    .from(table)
    .select("*")
    .eq("id", id)
    .single();

  if (beforeError) throw beforeError;

  const updated = await updateModuleRow(args);

  await writeAuditLog({
    currentUser: args.currentUser,
    moduleKey: args.module,
    tableName: args.table,
    recordId: updated.id,
    action: "update",
    beforeData,
    afterData: updated,
    metadata: {},
  });

  return updated;
}

export async function deleteAuditedModuleRow(args) {
  const { table, id } = args;

  const { data: beforeData, error: beforeError } = await supabase
    .from(table)
    .select("*")
    .eq("id", id)
    .single();

  if (beforeError) throw beforeError;

  await deleteModuleRow(args);

  await writeAuditLog({
    currentUser: args.currentUser,
    moduleKey: args.module,
    tableName: args.table,
    recordId: id,
    action: "delete",
    beforeData,
    afterData: null,
    metadata: {},
  });

  return true;
}