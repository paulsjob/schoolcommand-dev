import { GoogleGenAI, Type } from "@google/genai";

export interface ParsedItem {
  child_name: string;
  type: "assignment" | "test" | "event" | "message" | "prep";
  title: string;
  description: string;
  due_date: string; // ISO format if possible
  priority: "low" | "medium" | "high";
}

let _ai: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      [
        "GEMINI_API_KEY is not set.",
        "",
        "Fix:",
        "1) Create a .env file in the project root (same folder as package.json).",
        "2) Add: GEMINI_API_KEY=your_key_here",
        "3) Restart the dev server.",
        "",
        "If this is on Vercel, add GEMINI_API_KEY in Project Settings → Environment Variables and redeploy.",
      ].join("\n")
    );
  }

  if (!_ai) {
    _ai = new GoogleGenAI({ apiKey });
  }

  return _ai;
}

export async function parseSchoolInfo(rawText: string): Promise<ParsedItem[]> {
  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Extract school-related assignments, tests, events, and action items from the following text.

Text: "${rawText}"

Return a JSON array of objects with these fields:
- child_name: The name of the child mentioned (if any)
- type: one of 'assignment', 'test', 'event', 'message', 'prep'
- title: short descriptive title
- description: more details
- due_date: ISO 8601 date string (estimate if only time or relative day is given, assume current year 2026)
- priority: 'low', 'medium', or 'high' based on urgency/importance`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            child_name: { type: Type.STRING },
            type: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            due_date: { type: Type.STRING },
            priority: { type: Type.STRING },
          },
          required: ["child_name", "type", "title", "description", "due_date", "priority"],
        },
      },
    },
  });

  try {
    return JSON.parse(response.text || "[]") as ParsedItem[];
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return [];
  }
}

export async function generateDailyBriefing(items: any[]): Promise<string> {
  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Based on these school items, generate a concise and helpful daily briefing for a parent.

Items: ${JSON.stringify(items)}

Focus on:
- What is happening today and tomorrow
- Any critical deadlines or tests
- Materials that need to be packed
- A summary of the overall workload

Use a warm, proactive executive assistant tone. Use Markdown for formatting.`,
  });

  return response.text || "No briefing available today.";
}