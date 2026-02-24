import { supabase } from "./_supabase.js";
import { generateDailyBriefing } from "./_gemini.js";

function toDateOnlyString(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const now = new Date();
    const today = toDateOnlyString(now);
    const tomorrow = toDateOnlyString(new Date(now.getTime() + 24 * 60 * 60 * 1000));

    // Pull items due today or tomorrow.
    // due_date is a DATE column, so comparing YYYY-MM-DD strings is fine.
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .gte("due_date", today)
      .lte("due_date", tomorrow)
      .order("due_date", { ascending: true })
      .limit(50);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const items = data ?? [];
    const markdown = await generateDailyBriefing(items);

    return res.status(200).json({
      date: today,
      markdown,
      itemCount: items.length,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: err?.message || "Unexpected error generating daily briefing",
    });
  }
}