// api/_supabase.ts
// CommonJS-friendly: no top-level ESM imports inside Vercel functions output

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createClient } = require("@supabase/supabase-js");

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Prefer service role on the server (Vercel functions), fall back to anon if missing
const key = serviceRoleKey || anonKey;

if (!url || !key) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY fallback) env vars"
  );
}

export const supabase = createClient(url, key);