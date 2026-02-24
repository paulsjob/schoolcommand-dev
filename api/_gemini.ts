import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is missing. Set it in your environment variables.");
}

const ai = new GoogleGenAI({ apiKey });

export async function generateDailyBriefing(items: any[]): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are an executive assistant for a busy parent.

Generate a concise, useful daily briefing based on these school items (JSON).
Focus on:
- Today and tomorrow
- Deadlines and tests
- What needs to be packed or prepared
- Any obvious priorities or risks

Write in Markdown.
Be direct and organized.
If there are no items, say that clearly and suggest the parent press Sync later.

Items:
${JSON.stringify(items, null, 2)}
`,
  });

  return response.text || "No briefing available today.";
}