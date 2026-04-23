import { invokeFunction } from "@/lib/api/invokeFunction";

export async function sendInvite(payload) {
  return invokeFunction("invite-user", payload);
}
