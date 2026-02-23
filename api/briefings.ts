import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "./_supabase";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { data, error } = await supabase
    .from("briefings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data ?? []);
}