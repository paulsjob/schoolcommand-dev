// api/items.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { supabase } = require("./_supabase");

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { data, error } = await supabase
    .from("items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data ?? []);
}