import { useEffect, useState } from "react";

type ApiState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: unknown };

async function fetchJson(path: string) {
  const res = await fetch(path, { headers: { Accept: "application/json" } });
  const text = await res.text();

  if (!res.ok) {
    throw new Error(`${path} failed (${res.status}): ${text}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function Section({
  title,
  state,
}: {
  title: string;
  state: ApiState;
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ margin: "0 0 8px 0" }}>{title}</h2>

      {state.status === "loading" && <div>Loading...</div>}

      {state.status === "error" && (
        <div style={{ color: "crimson", fontWeight: 600 }}>
          Error: {state.message}
        </div>
      )}

      {state.status === "success" && (
        <pre
          style={{
            background: "#0b0b0b",
            color: "#f2f2f2",
            padding: 16,
            borderRadius: 10,
            overflowX: "auto",
            margin: 0,
          }}
        >
          {JSON.stringify(state.data, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function ApiSmokeTest() {
  const [children, setChildren] = useState<ApiState>({ status: "loading" });
  const [items, setItems] = useState<ApiState>({ status: "loading" });
  const [briefings, setBriefings] = useState<ApiState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const data = await fetchJson("/api/children");
        if (!cancelled) setChildren({ status: "success", data });
      } catch (e: any) {
        if (!cancelled) setChildren({ status: "error", message: e?.message ?? String(e) });
      }

      try {
        const data = await fetchJson("/api/items");
        if (!cancelled) setItems({ status: "success", data });
      } catch (e: any) {
        if (!cancelled) setItems({ status: "error", message: e?.message ?? String(e) });
      }

      try {
        const data = await fetchJson("/api/briefings");
        if (!cancelled) setBriefings({ status: "success", data });
      } catch (e: any) {
        if (!cancelled) setBriefings({ status: "error", message: e?.message ?? String(e) });
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
      <h1 style={{ marginTop: 0 }}>API Smoke Test</h1>

      <Section title="/api/children" state={children} />
      <Section title="/api/items" state={items} />
      <Section title="/api/briefings" state={briefings} />
    </div>
  );
}