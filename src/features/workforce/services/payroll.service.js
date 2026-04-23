import { runPayrollSync } from "@/api/payroll";

export async function syncPayroll(input) {
  return runPayrollSync(input);
}
