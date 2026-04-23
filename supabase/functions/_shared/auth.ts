import { createClient } from "npm:@supabase/supabase-js@2";

export function getClients(authHeader?: string | null) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const userClient = createClient(supabaseUrl, anonKey, {
    global: authHeader ? { headers: { Authorization: authHeader } } : undefined,
  });

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  return { userClient, adminClient };
}

export async function requireUser(authHeader?: string | null) {
  const { userClient, adminClient } = getClients(authHeader);

  const {
    data: { user },
    error,
  } = await userClient.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("Profile not found");
  }

  return { user, profile, userClient, adminClient };
}
