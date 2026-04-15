import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-invite-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const PROJECT_URL = Deno.env.get("PROJECT_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");
    const INVITE_FUNCTION_SECRET = Deno.env.get("INVITE_FUNCTION_SECRET");
    const APP_URL = Deno.env.get("APP_URL") || "https://www.nsbtek.com";
    const ZOHO_EMAIL = Deno.env.get("ZOHO_EMAIL");
    const ZOHO_PASSWORD = Deno.env.get("ZOHO_PASSWORD");

    if (!PROJECT_URL) {
      return jsonResponse({ error: "Missing PROJECT_URL secret" }, 500);
    }
    if (!SERVICE_ROLE_KEY) {
      return jsonResponse({ error: "Missing SERVICE_ROLE_KEY secret" }, 500);
    }
    if (!INVITE_FUNCTION_SECRET) {
      return jsonResponse({ error: "Missing INVITE_FUNCTION_SECRET secret" }, 500);
    }
    if (!ZOHO_EMAIL) {
      return jsonResponse({ error: "Missing ZOHO_EMAIL secret" }, 500);
    }
    if (!ZOHO_PASSWORD) {
      return jsonResponse({ error: "Missing ZOHO_PASSWORD secret" }, 500);
    }

    const incomingSecret = req.headers.get("x-invite-secret");
    if (!incomingSecret || incomingSecret !== INVITE_FUNCTION_SECRET) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const currentUserId = String(body?.currentUserId || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const full_name = String(body?.full_name || "").trim();
    const role = String(body?.role || "employee").trim();
    const manager_id = body?.manager_id || null;
    const redirectTo = String(body?.redirectTo || `${APP_URL}/reset-password`);

    if (!currentUserId) {
      return jsonResponse({ error: "Current user is required" }, 400);
    }
    if (!email) {
      return jsonResponse({ error: "Email is required" }, 400);
    }
    if (!role) {
      return jsonResponse({ error: "Role is required" }, 400);
    }

    const admin = createClient(PROJECT_URL, SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 1) Verify acting admin
    const { data: actingProfile, error: actingProfileError } = await admin
      .from("profiles")
      .select("id, role, organization_id, full_name, email")
      .eq("id", currentUserId)
      .single();

    if (actingProfileError || !actingProfile) {
      return jsonResponse(
        {
          error:
            actingProfileError?.message || "Current user profile not found",
        },
        403,
      );
    }

    if (actingProfile.role !== "admin") {
      return jsonResponse({ error: "Only admins can invite users" }, 403);
    }

    // 2) Check if profile already exists
    const { data: existingProfile, error: existingProfileError } = await admin
      .from("profiles")
      .select("id, organization_id, email, full_name, role, manager_id, status")
      .eq("email", email)
      .maybeSingle();

    if (existingProfileError) {
      return jsonResponse({ error: existingProfileError.message }, 400);
    }

    if (
      existingProfile?.organization_id &&
      existingProfile.organization_id !== actingProfile.organization_id
    ) {
      return jsonResponse(
        { error: "This email already belongs to another organization" },
        409,
      );
    }

    // 3) New user gets invite, existing user gets recovery
    const linkType: "invite" | "recovery" = existingProfile ? "recovery" : "invite";

    const linkResult = await admin.auth.admin.generateLink({
      type: linkType,
      email,
      options: {
        redirectTo,
      },
    });

    if (linkResult.error) {
      return jsonResponse(
        {
          error:
            linkResult.error.message ||
            `Failed to generate ${linkType} link`,
        },
        400,
      );
    }

    const authUserId = linkResult.data?.user?.id || existingProfile?.id || null;
    const actionLink =
      linkResult.data?.properties?.action_link || linkResult.data?.action_link;

    if (!actionLink) {
      return jsonResponse({ error: "Action link was not generated" }, 500);
    }

    // 4) Upsert profile so admin portal can find the user
    if (authUserId) {
      const { error: upsertError } = await admin.from("profiles").upsert(
        {
          id: authUserId,
          email,
          full_name,
          role,
          manager_id,
          organization_id: actingProfile.organization_id,
          status: "invited",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

      if (upsertError) {
        return jsonResponse({ error: upsertError.message }, 400);
      }
    }

    // 5) Send custom email via Zoho
    const transporter = nodemailer.createTransport({
      host: "smtp.zoho.com",
      port: 465,
      secure: true,
      auth: {
        user: ZOHO_EMAIL,
        pass: ZOHO_PASSWORD,
      },
    });

    const safeName = escapeHtml(full_name || "Team Member");
    const heading =
      linkType === "invite" ? "Welcome to NSBTEK" : "Reset Your Password";
    const subject =
      linkType === "invite"
        ? "Welcome to NSBTEK – Set Up Your Account"
        : "NSBTEK Password Reset Instructions";
    const intro =
      linkType === "invite"
        ? "Your NSBTEK account has been created by our HR team."
        : "A password reset was requested for your NSBTEK account.";
    const buttonText =
      linkType === "invite" ? "Set Up Account" : "Reset Password";

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 640px; margin: 0 auto;">
        <h2 style="margin-bottom: 12px;">${heading}</h2>

        <p>Hello ${safeName},</p>

        <p>${intro}</p>

        <p>Please click the button below to continue:</p>

        <p style="margin: 24px 0;">
          <a
            href="${actionLink}"
            style="background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; display: inline-block;"
          >
            ${buttonText}
          </a>
        </p>

        <p>After setting your password, return to the NSBTEK portal and sign in using your company email address.</p>

        <p>If you need help, please contact HR at <a href="mailto:hr@nsbtek.com">hr@nsbtek.com</a>.</p>

        <p style="margin-top: 28px;">
          Regards,<br />
          <strong>NSBTEK HR</strong>
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: `"NSBTEK HR" <${ZOHO_EMAIL}>`,
      to: email,
      subject,
      html,
    });

    return jsonResponse({
      success: true,
      email,
      mode: linkType,
      message:
        linkType === "invite"
          ? "Invitation email sent successfully"
          : "Password reset email sent successfully",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";

    return jsonResponse({ error: message }, 500);
  }
});