import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MODULES, canEdit } from "@/lib/permissions";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { createAccessRequest, listAccessRequests, reviewAccessRequest } from "@/api/accessRequests";
import { toast } from "sonner";

const MODULE_LABELS = Object.fromEntries(MODULES.map((m) => [m.key, `${m.section} — ${m.label}`]));

export default function RequestAccess() {
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [moduleKey, setModuleKey] = useState("");
  const [reason, setReason] = useState("");

  const { data = [] } = useQuery({
    queryKey: ["access-requests", user?.id],
    queryFn: () => listAccessRequests(user),
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: () => createAccessRequest(user, { module_key: moduleKey, reason }),
    onSuccess: async () => {
      toast.success("Request submitted");
      setOpen(false);
      setModuleKey("");
      setReason("");
      await queryClient.invalidateQueries({ queryKey: ["access-requests", user?.id] });
    },
    onError: (error) => toast.error(error.message || "Failed to submit request"),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status }) => reviewAccessRequest(user, id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["access-requests", user?.id] });
    },
    onError: (error) => toast.error(error.message || "Failed to review request"),
  });

  const isAdminLike = canEdit(user, "users");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Request Access</h1>
          <p className="text-sm text-muted-foreground mt-1">Submit and track access requests.</p>
        </div>
        <Button onClick={() => setOpen(true)}>New Request</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.map((item) => (
            <div key={item.id} className="rounded-xl border p-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-medium">{MODULE_LABELS[item.module_key] || item.module_key}</div>
                <div className="text-sm text-muted-foreground mt-1">{item.reason || "No reason provided"}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{item.status}</Badge>
                {isAdminLike && item.status === "pending" && (
                  <>
                    <Button variant="outline" onClick={() => reviewMutation.mutate({ id: item.id, status: "approved" })}>Approve</Button>
                    <Button variant="destructive" onClick={() => reviewMutation.mutate({ id: item.id, status: "rejected" })}>Reject</Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New access request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Module</Label>
              <Select value={moduleKey} onValueChange={setModuleKey}>
                <SelectTrigger><SelectValue placeholder="Select module" /></SelectTrigger>
                <SelectContent>
                  {MODULES.map((module) => (
                    <SelectItem key={module.key} value={module.key}>
                      {MODULE_LABELS[module.key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!moduleKey || createMutation.isPending}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
