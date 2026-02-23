import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Minimal demo briefing.
  return res.status(200).json([
    {
      id: "briefing-1",
      createdAt: new Date().toISOString(),
      text: "Daily briefing placeholder. Run Sync Agent to generate the real one.",
    },
  ]);
}