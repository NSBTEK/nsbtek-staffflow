import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { requireUser } from "../_shared/auth.ts";
import { json } from "../_shared/response.ts";
import { createTransport } from "npm:nodemailer@6.9.15";

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return json({ ok: true }, 200, origin);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const { profile, adminClient } = await requireUser(authHeader);

    if (!["company_admin", "platform_admin"].includes(profile.role)) {
      return json({ error: "Forbidden" }, 403, origin);
    }

    const body = await req.json();
    const { email, full_name, role, role_group_id } = body;

    if (!email || !role_group_id) {
      return json({ error: "email and role_group_id are required" }, 400, origin);
    }

    const redirectTo = `${Deno.env.get("VITE_APP_URL") || "https://www.nsbtek.com"}/reset-password`;

    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: {
        full_name: full_name || "",
        role: role || "staff",
        organization_id: profile.organization_id,
        role_group_id,
      },
    });

    if (error) {
      return json({ error: error.message }, 400, origin);
    }

    const transporter = createTransport({
      host: Deno.env.get("ZOHO_SMTP_HOST"),
      port: Number(Deno.env.get("ZOHO_SMTP_PORT") || 465),
      secure: true,
      auth: {
        user: Deno.env.get("ZOHO_SMTP_USER"),
        pass: Deno.env.get("ZOHO_SMTP_PASS"),
      },
    });

    await transporter.sendMail({
      from: Deno.env.get("ZOHO_SMTP_USER"),
      to: email,
      subject: "You are invited to NSBTEK StaffFlow",
      html: `<p>Hello ${full_name || "User"},</p><p>You have been invited to join NSBTEK StaffFlow.</p><p>Please check your email invitation link to activate your account.</p>`,
    });

    await adminClient.from("audit_logs").insert({
      organization_id: profile.organization_id,
      actor_user_id: profile.id,
      module: "users",
      action: "invite_user",
      entity_type: "user_invite",
      metadata: { email, role, role_group_id },
    });

    return json({ ok: true, invite: data.user }, 200, origin);
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      500,
      origin
    );
  }
});
