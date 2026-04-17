import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { createModuleRow } from "@/lib/supabaseCrud";
import { uploadDocumentToParser, mapParsedResumeToCandidate } from "@/lib/parsing";

function mapParsedDocumentToJob(parsed) {
  return {
    title: parsed.job_title || parsed.title || "",
    location: parsed.location || "",
    description: parsed.description || parsed.summary || "",
    skills_required: Array.isArray(parsed.skills) ? parsed.skills.join(", ") : parsed.skills || "",
    status: "open",
    source: "resume_parser",
  };
}

export default function ResumeParser() {
  const queryClient = useQueryClient();
  const { authUser } = useAuth();
  const [target, setTarget] = useState("candidate");
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);

  const parseMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Please choose a file first");
      return uploadDocumentToParser(file);
    },
    onSuccess: (result) => {
      setParsed(result);
      toast.success("Document parsed");
    },
    onError: (error) => toast.error(error.message || "Failed to parse document"),
  });

  const saveCandidateMutation = useMutation({
    mutationFn: (payload) =>
      createModuleRow({
        table: "candidates",
        payload,
        currentUser: authUser,
        allowedKeys: [
          "first_name",
          "last_name",
          "email",
          "phone",
          "status",
          "current_title",
          "location",
          "experience_years",
          "skills",
          "summary",
          "current_company",
          "source",
        ],
      }),
    onSuccess: async () => {
      toast.success("Candidate created");
      await queryClient.invalidateQueries({ queryKey: ["candidates"] });
    },
    onError: (error) => toast.error(error.message || "Failed to save candidate"),
  });

  const saveJobMutation = useMutation({
    mutationFn: (payload) =>
      createModuleRow({
        table: "jobs",
        payload,
        currentUser: authUser,
        allowedKeys: [
          "title",
          "location",
          "description",
          "skills_required",
          "status",
          "source",
        ],
      }),
    onSuccess: async () => {
      toast.success("Job created");
      await queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (error) => toast.error(error.message || "Failed to save job"),
  });

  const normalizedCandidate = parsed ? mapParsedResumeToCandidate(parsed) : null;
  const normalizedJob = parsed ? mapParsedDocumentToJob(parsed) : null;

  const handleSave = () => {
    if (!parsed) return;
    if (target === "candidate") {
      saveCandidateMutation.mutate({ ...normalizedCandidate, source: "resume_parser" });
    } else {
      saveJobMutation.mutate({ ...normalizedJob, source: "resume_parser" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Resume Parser</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a resume or document, parse it, and save the result into Candidates or Jobs.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Target Module</Label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              >
                <option value="candidate">Candidates</option>
                <option value="job">Jobs</option>
              </select>
            </div>

            <div>
              <Label>Document</Label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.rtf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {file ? <div className="mt-2 text-sm text-slate-600">Selected: {file.name}</div> : null}
            </div>

            <Button onClick={() => parseMutation.mutate()} disabled={!file || parseMutation.isPending}>
              {parseMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Parse document
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Parsed output</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!parsed ? (
              <div className="text-sm text-muted-foreground">No parsed result yet.</div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Badge>Target: {target === "candidate" ? "Candidates" : "Jobs"}</Badge>
                  <Badge>Parsed</Badge>
                </div>

                <pre className="rounded-xl bg-slate-50 border p-4 text-xs overflow-auto">
                  {JSON.stringify(target === "candidate" ? normalizedCandidate : normalizedJob, null, 2)}
                </pre>

                <Button
                  onClick={handleSave}
                  disabled={saveCandidateMutation.isPending || saveJobMutation.isPending}
                >
                  {(saveCandidateMutation.isPending || saveJobMutation.isPending) ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Save to {target === "candidate" ? "Candidates" : "Jobs"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}