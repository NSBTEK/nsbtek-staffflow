import React, { useMemo, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getWeeklyTimesheets,
  createOrUpdateWeeklyTimesheet,
  submitTimesheet,
  approveTimesheet,
} from "@/api/timesheets";
import TimesheetWeekGrid from "@/components/timesheets/TimesheetWeekGrid";
import TimesheetAttachmentUpload from "@/components/timesheets/TimesheetAttachmentUpload";
import { getProfileOrThrow } from "@/lib/profile";

function getWeekDays(startDateString) {
  const start = new Date(startDateString);
  const days = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push({
      work_date: d.toISOString().slice(0, 10),
      hours: 0,
      task_code: "",
      notes: "",
    });
  }
  return days;
}

function getCurrentWeekMonday() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().slice(0, 10);
}

function addDays(dateString, count) {
  const d = new Date(dateString);
  d.setDate(d.getDate() + count);
  return d.toISOString().slice(0, 10);
}

export default function Timesheets() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();

  const [weekStart, setWeekStart] = useState(getCurrentWeekMonday());
  const [notes, setNotes] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [entries, setEntries] = useState(getWeekDays(getCurrentWeekMonday()));
  const [managerRemarks, setManagerRemarks] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["current-profile-timesheets", authUser?.id],
    queryFn: () => getProfileOrThrow(authUser.id),
    enabled: !!authUser?.id,
  });

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ["weekly-timesheets", authUser?.id],
    queryFn: () => getWeeklyTimesheets(authUser),
    enabled: !!authUser?.id,
  });

  const selectedTimesheet = useMemo(() => {
    return rows.find((row) => row.id === selectedId) || null;
  }, [rows, selectedId]);

  const saveMutation = useMutation({
    mutationFn: (payload) => createOrUpdateWeeklyTimesheet(authUser, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-timesheets", authUser?.id] });
    },
  });

  const submitMutation = useMutation({
    mutationFn: (id) => submitTimesheet(authUser, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-timesheets", authUser?.id] });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, action, remarks }) =>
      approveTimesheet(authUser, id, action, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-timesheets", authUser?.id] });
      setManagerRemarks("");
    },
  });

  const handleNewWeek = () => {
    const start = getCurrentWeekMonday();
    setSelectedId(null);
    setWeekStart(start);
    setNotes("");
    setEntries(getWeekDays(start));
  };

  const loadExisting = (row) => {
    setSelectedId(row.id);
    setWeekStart(row.week_start);
    setNotes(row.notes || "");

    const mapped = getWeekDays(row.week_start).map((day) => {
      const found = row.timesheet_entries?.find(
        (entry) => entry.work_date === day.work_date
      );

      return found
        ? {
            work_date: found.work_date,
            hours: found.hours,
            task_code: found.task_code || "",
            notes: found.notes || "",
          }
        : day;
    });

    setEntries(mapped);
  };

  const handleSaveDraft = () => {
    saveMutation.mutate({
      id: selectedId,
      week_start: weekStart,
      week_end: addDays(weekStart, 6),
      notes,
      status: "draft",
      entries,
    });
  };

  const handleSubmit = async () => {
    const result = await saveMutation.mutateAsync({
      id: selectedId,
      week_start: weekStart,
      week_end: addDays(weekStart, 6),
      notes,
      status: "draft",
      entries,
    });

    await submitMutation.mutateAsync(result);
    setSelectedId(result);
  };

  const totalHours = entries.reduce((sum, row) => sum + Number(row.hours || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Timesheets</h1>
          <p className="text-muted-foreground">
            Submit weekly timesheets for approval. Maximum 8 hours per day.
          </p>
        </div>

        <button
          onClick={handleNewWeek}
          className="rounded-xl bg-blue-600 text-white px-4 py-2 font-medium"
        >
          + New Weekly Timesheet
        </button>
      </div>

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="rounded-2xl border bg-card p-5 space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-1">Week Start</label>
              <input
                type="date"
                value={weekStart}
                onChange={(e) => {
                  setWeekStart(e.target.value);
                  setEntries(getWeekDays(e.target.value));
                }}
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Week End</label>
              <input
                type="date"
                value={addDays(weekStart, 6)}
                disabled
                className="w-full rounded-lg border px-3 py-2 bg-muted"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Weekly Total</label>
              <input
                value={`${totalHours} hours`}
                disabled
                className="w-full rounded-lg border px-3 py-2 bg-muted"
              />
            </div>
          </div>

          <TimesheetWeekGrid entries={entries} setEntries={setEntries} />

          <div>
            <label className="block text-sm mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <TimesheetAttachmentUpload
            timesheetId={selectedId}
            onUploaded={() =>
              queryClient.invalidateQueries({
                queryKey: ["weekly-timesheets", authUser?.id],
              })
            }
          />

          <div className="flex flex-wrap justify-end gap-3">
            <button
              onClick={handleSaveDraft}
              className="rounded-xl border px-4 py-2 font-medium"
            >
              Save Draft
            </button>

            <button
              onClick={handleSubmit}
              className="rounded-xl bg-blue-600 text-white px-4 py-2 font-medium"
            >
              Submit for Approval
            </button>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 space-y-4">
          <h2 className="text-lg font-semibold">Weekly Submissions</h2>

          {isLoading ? (
            <div>Loading timesheets...</div>
          ) : error ? (
            <div className="text-red-600">{error.message}</div>
          ) : rows.length === 0 ? (
            <div className="text-muted-foreground">No timesheets submitted yet.</div>
          ) : (
            <div className="space-y-3">
              {rows.map((row) => (
                <div key={row.id} className="rounded-xl border p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">
                        {row.week_start} to {row.week_end}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Status: {row.status}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total: {row.total_hours} hours
                      </div>
                    </div>

                    <button
                      onClick={() => loadExisting(row)}
                      className="rounded-lg border px-3 py-1.5 text-sm"
                    >
                      Open
                    </button>
                  </div>

                  {row.timesheet_attachments?.length > 0 && (
                    <div className="pt-2 space-y-1">
                      <div className="text-sm font-medium">Attachments</div>
                      {row.timesheet_attachments.map((file) => (
                        <a
                          key={file.id}
                          href={file.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-sm text-blue-600 underline"
                        >
                          {file.file_name}
                        </a>
                      ))}
                    </div>
                  )}

                  {profile?.role === "manager" && row.status === "submitted" && (
                    <div className="space-y-2 pt-2">
                      <textarea
                        placeholder="Manager remarks"
                        value={managerRemarks}
                        onChange={(e) => setManagerRemarks(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border px-3 py-2"
                      />

                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() =>
                            reviewMutation.mutate({
                              id: row.id,
                              action: "disapproved",
                              remarks: managerRemarks,
                            })
                          }
                          className="rounded-xl border border-red-200 text-red-600 px-4 py-2"
                        >
                          Disapprove
                        </button>

                        <button
                          onClick={() =>
                            reviewMutation.mutate({
                              id: row.id,
                              action: "approved",
                              remarks: managerRemarks,
                            })
                          }
                          className="rounded-xl bg-green-600 text-white px-4 py-2"
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}