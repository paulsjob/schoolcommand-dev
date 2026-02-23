import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Minimal placeholder. Replace later with DB-backed children.
  return res.status(200).json([
    { id: "child-1", name: "Child 1", grade: 5 },
    { id: "child-2", name: "Child 2", grade: 4 },
    { id: "child-3", name: "Child 3", grade: "K" },
  ]);
}