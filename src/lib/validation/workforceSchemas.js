import { z } from "zod";

export const timesheetSchema = z.object({
  worker_id: z.string().uuid(),
  week_start: z.string().min(1),
  total_hours: z.number().min(0),
});

export const expenseSchema = z.object({
  worker_id: z.string().uuid(),
  amount: z.number().min(0),
  category: z.string().min(1),
});
