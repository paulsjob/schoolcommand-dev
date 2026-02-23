import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "./_supabase.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { data: children } = await supabase
    .from("children")
    .select("id");

  if (!children || children.length === 0) {
    await supabase.from("children").insert([
      { id: "child-1", name: "Child 1", grade: "5" },
      { id: "child-2", name: "Child 2", grade: "4" },
      { id: "child-3", name: "Child 3", grade: "K" }
    ]);
  }

  const todayPlus1 = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const todayPlus2 = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

  const newItems = [
    {
      child_id: "child-1",
      type: "Prep",
      description: "Bring library book",
      due_date: todayPlus1.toISOString().slice(0, 10),
      source: "Demo Sync"
    },
    {
      child_id: "child-2",
      type: "Event",
      description: "Spirit Day",
      due_date: todayPlus2.toISOString().slice(0, 10),
      source: "Demo Sync"
    }
  ];

  const insItems = await supabase
    .from("items")
    .insert(newItems)
    .select("*");

  if (insItems.error) {
    return res.status(500).json({ error: insItems.error.message });
  }

  const briefingText =
    "Sync complete. Demo data inserted into Supabase. Next step: replace demo generation with Gemini extraction + dedupe.";

  const insBrief = await supabase
    .from("briefings")
    .insert([{ text: briefingText }])
    .select("*");

  if (insBrief.error) {
    return res.status(500).json({ error: insBrief.error.message });
  }

  return res.status(200).json({
    ok: true,
    insertedItems: insItems.data?.length ?? 0,
    insertedBriefings: insBrief.data?.length ?? 0
  });
}