import { supabase } from "@/lib/supabaseClient";
import { getProfileOrThrow } from "@/lib/profile";

export async function getWeeklyTimesheets(currentUser) {
  const profile = await getProfileOrThrow(currentUser.id);

  let query = supabase
    .from("timesheet_headers")
    .select(`
      *,
      timesheet_entries (*),
      timesheet_attachments (*),
      timesheet_approvals (*)
    `)
    .eq("organization_id", profile.organization_id)
    .order("week_start", { ascending: false });

  if (profile.role === "employee") {
    query = query.eq("employee_id", profile.id);
  }

  if (profile.role === "manager") {
    query = query.or(`manager_id.eq.${profile.id},employee_id.eq.${profile.id}`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createOrUpdateWeeklyTimesheet(currentUser, payload) {
  const profile = await getProfileOrThrow(currentUser.id);

  const entries = payload.entries || [];
  const totalHours = entries.reduce((sum, row) => sum + Number(row.hours || 0), 0);

  for (const row of entries) {
    if (Number(row.hours || 0) > 8) {
      throw new Error(`Hours cannot exceed 8 for ${row.work_date}`);
    }
  }

  let headerId = payload.id;

  if (!headerId) {
    const { data: header, error: headerError } = await supabase
      .from("timesheet_headers")
      .insert({
        organization_id: profile.organization_id,
        employee_id: profile.id,
        manager_id: profile.manager_id,
        week_start: payload.week_start,
        week_end: payload.week_end,
        status: payload.status || "draft",
        total_hours: totalHours,
        notes: payload.notes || null,
        created_by: currentUser.id,
        updated_by: currentUser.id,
      })
      .select()
      .single();

    if (headerError) throw headerError;
    headerId = header.id;
  } else {
    const { error: updateError } = await supabase
      .from("timesheet_headers")
      .update({
        total_hours: totalHours,
        notes: payload.notes || null,
        status: payload.status || "draft",
        updated_by: currentUser.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", headerId);

    if (updateError) throw updateError;

    const { error: deleteEntriesError } = await supabase
      .from("timesheet_entries")
      .delete()
      .eq("timesheet_id", headerId);

    if (deleteEntriesError) throw deleteEntriesError;
  }

  if (entries.length) {
    const { error: entryError } = await supabase
      .from("timesheet_entries")
      .insert(
        entries.map((row) => ({
          timesheet_id: headerId,
          work_date: row.work_date,
          hours: Number(row.hours || 0),
          notes: row.notes || null,
          task_code: row.task_code || null,
        }))
      );

    if (entryError) throw entryError;
  }

  return headerId;
}

export async function submitTimesheet(currentUser, timesheetId, remarks = null) {
  const { error: updateError } = await supabase
    .from("timesheet_headers")
    .update({
      status: "submitted",
      updated_by: currentUser.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", timesheetId);

  if (updateError) throw updateError;

  const { error: logError } = await supabase.from("timesheet_approvals").insert({
    timesheet_id: timesheetId,
    action: "submitted",
    action_by: currentUser.id,
    remarks,
  });

  if (logError) throw logError;
}

export async function approveTimesheet(currentUser, timesheetId, action, remarks = null) {
  const nextStatus = action === "approved" ? "approved" : "disapproved";

  const { error: updateError } = await supabase
    .from("timesheet_headers")
    .update({
      status: nextStatus,
      updated_by: currentUser.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", timesheetId);

  if (updateError) throw updateError;

  const { error: logError } = await supabase.from("timesheet_approvals").insert({
    timesheet_id: timesheetId,
    action,
    action_by: currentUser.id,
    remarks,
  });

  if (logError) throw logError;
}
