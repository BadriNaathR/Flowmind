// Sprint 4 — Full implementation
import { useParams } from "react-router-dom";

export default function WorkflowDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="min-h-screen p-8" style={{ background: "var(--bg)" }}>
      <div className="max-w-4xl mx-auto surface-card p-10 text-center">
        <h1 className="text-2xl font-bold mb-2">Workflow Detail</h1>
        <p style={{ color: "var(--fg-muted)" }}>ID: {id} — Sprint 4 implementation coming soon.</p>
      </div>
    </div>
  );
}
