import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileText, Sparkles, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { createModuleRow } from "@/lib/supabaseCrud";

function parseResumeText(resumeText) {
  const lines = resumeText.split("\n").map((l) => l.trim()).filter(Boolean);
  const firstLine = lines[0] || "";
  const [first_name = "", ...rest] = firstLine.split(" ");
  const last_name = rest.join(" ");
  const email = lines.find((line) => /@/.test(line)) || "";
  const phone = lines.find((line) => /\d{3}.*\d{3}.*\d{4}/.test(line)) || "";

  return {
    first_name,
    last_name,
    email,
    phone,
    title: "",
    location: "",
    experience: "",
    skills: "",
    notes: resumeText,
    status: "new",
    source: "resume_parser",
  };
}

export default function ResumeParser() {
  const queryClient = useQueryClient();
  const { authUser } = useAuth();
  const [resumeText, setResumeText] = useState("");
  const [parsed, setParsed] = useState(null);

  const saveMutation = useMutation({
    mutationFn: (payload) => createModuleRow({
      table: "candidates",
      payload,
      currentUser: authUser,
      allowedKeys: [
        "first_name",
        "last_name",
        "email",
        "phone",
        "status",
        "title",
        "location",
        "experience",
        "skills",
        "notes",
        "source",
      ],
    }),
    onSuccess: async () => {
      toast.success("Candidate saved");
      await queryClient.invalidateQueries({ queryKey: ["candidates"] });
    },
    onError: (error) => toast.error(error.message || "Failed to save candidate"),
  });

  const handleParse = () => {
    if (!resumeText.trim()) return toast.error("Paste resume text first");
    setParsed(parseResumeText(resumeText));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Resume Parser</h1>
        <p className="text-sm text-muted-foreground mt-1">Paste a resume and save the parsed result directly to candidates.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Resume input</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              className="min-h-[320px]"
              placeholder="Paste resume text here"
            />
            <Button onClick={handleParse}>
              <Sparkles className="h-4 w-4 mr-2" />
              Parse resume
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Parsed candidate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!parsed ? (
              <div className="text-sm text-muted-foreground">No parsed result yet.</div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>First name</Label>
                    <Input value={parsed.first_name || ""} onChange={(e) => setParsed((s) => ({ ...s, first_name: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Last name</Label>
                    <Input value={parsed.last_name || ""} onChange={(e) => setParsed((s) => ({ ...s, last_name: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={parsed.email || ""} onChange={(e) => setParsed((s) => ({ ...s, email: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={parsed.phone || ""} onChange={(e) => setParsed((s) => ({ ...s, phone: e.target.value }))} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>Source: {parsed.source}</Badge>
                  <Badge>Status: {parsed.status}</Badge>
                </div>
                <Button onClick={() => saveMutation.mutate(parsed)} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Save candidate
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
