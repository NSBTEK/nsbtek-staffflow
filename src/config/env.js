function required(name, value) {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const env = {
  supabaseUrl: required("VITE_SUPABASE_URL", import.meta.env.VITE_SUPABASE_URL),
  supabaseAnonKey: required("VITE_SUPABASE_ANON_KEY", import.meta.env.VITE_SUPABASE_ANON_KEY),
  appUrl: required("VITE_APP_URL", import.meta.env.VITE_APP_URL),
  isProd: import.meta.env.PROD,
  isDev: import.meta.env.DEV,
};
