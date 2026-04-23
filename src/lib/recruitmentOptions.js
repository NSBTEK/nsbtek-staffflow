import { supabase } from "@/lib/supabaseClient";
import { getProfileOrThrow } from "@/lib/profile";

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return value;
    }
  }
  return "";
}

function joinNonEmpty(values, separator = " • ") {
  return values.filter((v) => v !== null && v !== undefined && String(v).trim() !== "").join(separator);
}

export async function listCandidateOptions(currentUser) {
  const profile = await getProfileOrThrow(currentUser.id);

  const { data, error } = await supabase
    .from("candidates")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((candidate) => {
    const fullName =
      firstNonEmpty(
        [candidate.first_name, candidate.last_name].filter(Boolean).join(" ").trim(),
        candidate.full_name,
        candidate.name
      ) || "Unnamed Candidate";

    const title =
      firstNonEmpty(
        candidate.current_title,
        candidate.job_title,
        candidate.designation,
        candidate.title,
        candidate.position
      );

    const email = firstNonEmpty(candidate.email, candidate.email_address);
    const phone = firstNonEmpty(candidate.phone, candidate.phone_number, candidate.mobile, candidate.contact_number);

    return {
      value: candidate.id,
      label: fullName,
      description: joinNonEmpty([title, email, phone]),
      keywords: joinNonEmpty(
        [
          candidate.first_name,
          candidate.last_name,
          candidate.full_name,
          candidate.name,
          title,
          email,
          phone,
          candidate.skills,
          candidate.location,
          candidate.city,
        ],
        " "
      ),
      raw: candidate,
    };
  });
}

export async function listJobOptions(currentUser) {
  const profile = await getProfileOrThrow(currentUser.id);

  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((job) => {
    const title = firstNonEmpty(job.title, job.job_title, job.position, job.role) || "Untitled Job";
    const location = firstNonEmpty(job.location, job.job_location, job.city);
    const status = firstNonEmpty(job.status, job.job_status);

    return {
      value: job.id,
      label: title,
      description: joinNonEmpty([location, status]),
      keywords: joinNonEmpty(
        [
          title,
          location,
          status,
          job.department,
          job.client_name,
          job.description,
        ],
        " "
      ),
      raw: job,
    };
  });
}

export async function listClientOptions(currentUser) {
  const profile = await getProfileOrThrow(currentUser.id);

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((client) => {
    const name = firstNonEmpty(client.name, client.client_name, client.company_name) || "Unnamed Client";
    const status = firstNonEmpty(client.status, client.client_status);
    const email = firstNonEmpty(client.email, client.email_address);
    const phone = firstNonEmpty(client.phone, client.phone_number, client.mobile);

    return {
      value: client.id,
      label: name,
      description: joinNonEmpty([status, email, phone]),
      keywords: joinNonEmpty(
        [
          name,
          status,
          email,
          phone,
          client.industry,
          client.city,
          client.location,
        ],
        " "
      ),
      raw: client,
    };
  });
}

export async function listOrganizationUserOptions(currentUser) {
  const profile = await getProfileOrThrow(currentUser.id);

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((user) => {
    const fullName =
      firstNonEmpty(
        user.full_name,
        user.name,
        [user.first_name, user.last_name].filter(Boolean).join(" ").trim(),
        user.email
      ) || "Unnamed User";

    const role = firstNonEmpty(user.role, user.job_title, user.designation);
    const email = firstNonEmpty(user.email, user.email_address);

    return {
      value: user.id,
      label: fullName,
      description: joinNonEmpty([role, email]),
      keywords: joinNonEmpty(
        [
          user.full_name,
          user.name,
          user.first_name,
          user.last_name,
          user.email,
          role,
          user.department,
        ],
        " "
      ),
      raw: user,
    };
  });
}