import React, { useEffect, useState } from "react";

type Child = { id: string; name: string; grade: string };

export default function ApiSmokeTest() {
  const [children, setChildren] = useState<Child[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/children", {
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`GET /api/children failed (${res.status}). ${text}`);
        }

        const data = (await res.json()) as Child[];

        if (!cancelled) setChildren(data);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h2 style={{ marginBottom: 8 }}>API Smoke Test</h2>

      {loading && <div>Loading /api/children...</div>}

      {error && (
        <div style={{ whiteSpace: "pre-wrap" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div style={{ marginBottom: 8 }}>
            <strong>Success.</strong> Received {children?.length ?? 0} children.
          </div>
          <pre
            style={{
              background: "#111",
              color: "#eee",
              padding: 12,
              borderRadius: 8,
              overflowX: "auto",
            }}
          >
            {JSON.stringify(children, null, 2)}
          </pre>
        </>
      )}
    </div>
  );
}