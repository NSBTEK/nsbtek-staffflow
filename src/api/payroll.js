import { invokeFunction } from "@/lib/api/invokeFunction";

export async function runPayrollSync(payload) {
  return invokeFunction("payroll-sync", payload);
}
