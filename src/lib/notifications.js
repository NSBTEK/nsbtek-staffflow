import { toast } from "sonner";

export function notifyChange(message = "Saved successfully") {
  toast.success(message);
}

export function notifyError(message = "Something went wrong") {
  toast.error(message);
}