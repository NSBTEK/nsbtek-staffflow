import { signInWithPassword } from "@/lib/auth/session";

export async function login(values) {
  return signInWithPassword({
    email: values.email,
    password: values.password,
  });
}
