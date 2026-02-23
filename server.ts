import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import dotenv from "dotenv";
import { google } from "googleapis";
import { Client } from "@microsoft/microsoft-graph-client";
import "isomorphic-fetch";
import { parseSchoolInfo, generateDailyBriefing } from "./src/services/geminiService.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("school.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS children (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    grade TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    child_id INTEGER,
    type TEXT NOT NULL, -- assignment, test, event, message, prep
    title TEXT NOT NULL,
    description TEXT,
    due_date TEXT,
    source_type TEXT,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id)
  );

  CREATE TABLE IF NOT EXISTS briefings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT UNIQUE,
    content TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Seed initial children if empty
const childCount = db.prepare("SELECT COUNT(*) as count FROM children").get() as { count: number };
if (childCount.count === 0) {
  db.prepare("INSERT INTO children (name, grade) VALUES (?, ?)").run("Child 1", "5th Grade");
  db.prepare("INSERT INTO children (name, grade) VALUES (?, ?)").run("Child 2", "4th Grade");
  db.prepare("INSERT INTO children (name, grade) VALUES (?, ?)").run("Child 3", "Kindergarten");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/children", (req, res) => {
    const children = db.prepare("SELECT * FROM children").all();
    res.json(children);
  });

  app.get("/api/items", (req, res) => {
    const items = db.prepare(`
      SELECT items.*, children.name as child_name 
      FROM items 
      LEFT JOIN children ON items.child_id = children.id
      ORDER BY due_date ASC
    `).all();
    res.json(items);
  });

  app.post("/api/items", (req, res) => {
    const { child_id, type, title, description, due_date, priority } = req.body;
    const result = db.prepare(`
      INSERT INTO items (child_id, type, title, description, due_date, priority)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(child_id, type, title, description, due_date, priority);
    res.json({ id: result.lastInsertRowid });
  });

  app.patch("/api/items/:id", (req, res) => {
    const { status } = req.body;
    db.prepare("UPDATE items SET status = ? WHERE id = ?").run(status, req.params.id);
    res.json({ success: true });
  });

  app.get("/api/briefings", (req, res) => {
    const briefings = db.prepare("SELECT * FROM briefings ORDER BY date DESC").all();
    res.json(briefings);
  });

  // OAuth Routes Placeholder
  app.get("/api/auth/google/url", (req, res) => {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.APP_URL}/auth/google/callback`
    );

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/calendar.readonly"
      ],
    });
    res.json({ url });
  });

  app.get("/auth/google/callback", (req, res) => {
    // In a real app, exchange code for tokens and store them
    res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ type: 'OAUTH_SUCCESS', provider: 'google' }, '*');
            window.close();
          </script>
          <p>Google Connected! Closing window...</p>
        </body>
      </html>
    `);
  });

  app.post("/api/sync", async (req, res) => {
    try {
      // Mock raw data that would normally come from Gmail/Teams/Web
      const mockRawData = [
        "From: Teacher Sarah. Hi parents, just a reminder that Child 1 has a math test this Friday. Also, Child 2 needs to bring a permission slip for the field trip by tomorrow.",
        "Newsletter: Kindergarten (Child 3) is having a 'B' day tomorrow. Please bring an item starting with B. Library books are due every Wednesday.",
        "Teams Post: Assignment posted for Grade 5: Science project draft due next Monday, March 2nd. High priority."
      ];

      const allParsedItems = [];
      for (const text of mockRawData) {
        const parsed = await parseSchoolInfo(text);
        allParsedItems.push(...parsed);
      }

      // Save to DB
      const children = db.prepare("SELECT * FROM children").all() as any[];
      
      for (const item of allParsedItems) {
        // Find child_id by name (fuzzy match or simple check)
        const child = children.find(c => item.child_name.toLowerCase().includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(item.child_name.toLowerCase()));
        
        if (child) {
          // Check for duplicates (simple title check for now)
          const existing = db.prepare("SELECT id FROM items WHERE title = ? AND child_id = ?").get(item.title, child.id);
          if (!existing) {
            db.prepare(`
              INSERT INTO items (child_id, type, title, description, due_date, priority, source_type)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(child.id, item.type, item.title, item.description, item.due_date, item.priority, 'agent_sync');
          }
        }
      }

      // Generate Briefing
      const currentItems = db.prepare("SELECT items.*, children.name as child_name FROM items LEFT JOIN children ON items.child_id = children.id WHERE status = 'pending'").all();
      const briefingContent = await generateDailyBriefing(currentItems);
      const today = new Date().toISOString().split('T')[0];
      
      db.prepare("INSERT OR REPLACE INTO briefings (date, content) VALUES (?, ?)").run(today, briefingContent);

      res.json({ success: true, count: allParsedItems.length });
    } catch (error) {
      console.error("Sync error:", error);
      res.status(500).json({ error: "Failed to sync" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
