// app/error.tsx
"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ padding: 24 }}>
      <h1>App error</h1>
      <pre style={{ whiteSpace: "pre-wrap" }}>{String(error.stack || error.message)}</pre>
      <button onClick={() => reset()} style={{ marginTop: 12, padding: "8px 12px", border: "1px solid #444" }}>
        Try again
      </button>
    </div>
  );
}
