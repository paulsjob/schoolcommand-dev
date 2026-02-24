import { supabase } from "./_supabase.js";

function makeTitle(type: string, description: string) {
  const trimmed = (description || "").trim();
  if (!trimmed) return type;

  // Simple title heuristic: first sentence or first ~50 chars
  const firstSentence = trimmed.split(".")[0]?.trim();
  const base = firstSentence && firstSentence.length <= 60 ? firstSentence : trimmed.slice(0, 60).trim();

  // Title-case-ish label
  const label =
    type === "assignment" ? "Assignment" :
    type === "test" ? "Test" :
    type === "event" ? "Event" :
    type === "message" ? "Message" :
    type === "prep" ? "Prep" :
    "Item";

  return `${label}: ${base}`;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 1) Load children so we can add child_name to items
  const { data: childrenData, error: childrenError } = await supabase
    .from("children")
    .select("id, name");

  if (childrenError) {
    return res.status(500).json({ error: childrenError.message });
  }

  const childNameById = new Map();
  for (const c of childrenData ?? []) {
    childNameById.set(c.id, c.name);
  }

  // 2) Load items
  const { data: itemsData, error: itemsError } = await supabase
    .from("items")
    .select("*")
    .order("created_at", { ascending: false });

  if (itemsError) {
    return res.status(500).json({ error: itemsError.message });
  }

  // 3) Normalize shape to match what App.tsx expects
  const normalized = (itemsData ?? []).map((item) => {
    const childName = childNameById.get(item.child_id) ?? item.child_id ?? "Unknown";

    return {
      id: item.id, // keep UUID string
      child_id: item.child_id, // keep string (ex: "child-1")
      child_name: childName,

      type: item.type,
      title: item.title ?? makeTitle(item.type, item.description),

      description: item.description ?? "",
      due_date: item.due_date ?? null,

      priority: item.priority ?? "medium",
      status: item.status ?? "pending",

      source_type: item.source ?? item.source_type ?? "manual",
    };
  });

  return res.status(200).json(normalized);
}