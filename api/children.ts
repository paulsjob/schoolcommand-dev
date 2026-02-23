import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "./_supabase.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { data: children, error } = await supabase
    .from("children")
    .select("*")
    .order("grade", { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (!children || children.length === 0) {
    const seed = [
      { id: "child-1", name: "Child 1", grade: "5" },
      { id: "child-2", name: "Child 2", grade: "4" },
      { id: "child-3", name: "Child 3", grade: "K" }
    ];

    const ins = await supabase.from("children").insert(seed);
    if (ins.error) {
      return res.status(500).json({ error: ins.error.message });
    }

    return res.status(200).json(seed);
  }

  return res.status(200).json(children);
}