import { captureError } from "@/lib/monitoring";

export function getErrorMessage(error, fallback = "Something went wrong") {
  if (error) {
    captureError(error, { fallback });
  }

  if (!error) return fallback;
  if (typeof error === "string") return error;
  if (error.message) return error.message;
  return fallback;
}
