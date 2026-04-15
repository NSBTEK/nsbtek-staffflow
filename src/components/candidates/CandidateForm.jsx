import React, { useState } from "react";
import ResumeUploadField from "@/components/candidates/ResumeUploadField";

export default function CandidateForm({ initialValues = {}, onSubmit, submitting = false }) {
  const [form, setForm] = useState({
    first_name: initialValues.first_name || "",
    last_name: initialValues.last_name || "",
    email: initialValues.email || "",
    phone: initialValues.phone || "",
    location: initialValues.location || "",
    skills: initialValues.skills || "",
    experience_years: initialValues.experience_years || "",
    current_company: initialValues.current_company || "",
    current_title: initialValues.current_title || "",
    summary: initialValues.summary || "",
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [rawParsed, setRawParsed] = useState(null);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleParsed = ({ mapped, raw, file }) => {
    setForm((prev) => ({ ...prev, ...mapped }));
    setResumeFile(file);
    setRawParsed(raw);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ form, resumeFile, rawParsed });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <ResumeUploadField onParsed={handleParsed} />

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">First Name</label>
          <input value={form.first_name} onChange={(e) => update("first_name", e.target.value)} className="w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Last Name</label>
          <input value={form.last_name} onChange={(e) => update("last_name", e.target.value)} className="w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input value={form.email} onChange={(e) => update("email", e.target.value)} className="w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Phone</label>
          <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className="w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Location</label>
          <input value={form.location} onChange={(e) => update("location", e.target.value)} className="w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Experience Years</label>
          <input value={form.experience_years} onChange={(e) => update("experience_years", e.target.value)} className="w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Current Company</label>
          <input value={form.current_company} onChange={(e) => update("current_company", e.target.value)} className="w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Current Title</label>
          <input value={form.current_title} onChange={(e) => update("current_title", e.target.value)} className="w-full rounded-lg border px-3 py-2" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Skills</label>
          <input value={form.skills} onChange={(e) => update("skills", e.target.value)} className="w-full rounded-lg border px-3 py-2" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Summary</label>
          <textarea value={form.summary} onChange={(e) => update("summary", e.target.value)} rows={5} className="w-full rounded-lg border px-3 py-2" />
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={submitting} className="rounded-xl bg-blue-600 text-white px-4 py-2 font-medium">
          {submitting ? "Saving..." : "Save Candidate"}
        </button>
      </div>
    </form>
  );
}
