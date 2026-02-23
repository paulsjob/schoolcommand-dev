import { supabase } from "./_supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { data, error } = await supabase
    .from("children")
    .select("*")
    .order("grade", { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (!data || data.length === 0) {
    const seed = [
      { id: "child-1", name: "Child 1", grade: "5" },
      { id: "child-2", name: "Child 2", grade: "4" },
      { id: "child-3", name: "Child 3", grade: "K" }
    ];

    const insert = await supabase.from("children").insert(seed);

    if (insert.error) {
      return res.status(500).json({ error: insert.error.message });
    }

    return res.status(200).json(seed);
  }

  return res.status(200).json(data);
}