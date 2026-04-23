import { z } from "zod";

export const jobSchema = z.object({
  title: z.string().min(2),
  status: z.string().min(1),
});

export const candidateSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
});
