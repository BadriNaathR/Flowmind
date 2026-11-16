import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Zap, Clock, Play, Pause, Trash2, History,
  CheckCircle, PauseCircle, AlertCircle, FileText,
  Mail, MessageSquare, FileSpreadsheet, BookOpen, Globe, Settings,
} from "lucide-react";
import api, { type Workflow } from "@/lib/api";

// ─── Integration colours & icons ─────────────────────────────────────────────

const INTEGRATION_META: Record<string, { color: string; Icon: React.ElementType }> = {
  gmail:    { color: "#EA4335", Icon: Mail },
  slack:    { color: "#E01E5A", Icon: MessageSquare },
  sheets:   { color: "#34A853", Icon: FileSpreadsheet },
  notion:   { color: "#a78bfa", Icon: BookOpen },
  http:     { color: "#38bdf8", Icon: Globe },
  internal: { color: "#94a3b8", Icon: Settings },
};

function integrationMeta(name: string) {
  return INTEGRATION_META[name?.toLowerCase()] ?? { color: "#94a3b8", Icon: Settings };
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Workflow["status"] }) {
  const cfg = {
    active:  { color: "#22c55e", bg: "#22c55e18", Icon: CheckCircle,  label: "Active"  },
    draft:   { color: "#94a3b8", bg: "#94a3b818", Icon: Clock,        label: "Draft"   },
    paused:  { color: "#f59e0b", bg: "#f59e0b18", Icon: PauseCircle,  label: "Paused"  },
    failed:  { color: "#ef4444", bg: "#ef444418", Icon: AlertCircle,  label: "Failed"  },
  };
  const { color, bg, Icon, label } = cfg[status] ?? cfg.draft;
  return (
    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
      style={{ background: bg, color, border: `1px solid ${color}30` }}>
      <Icon size={11} /> {label}
    </span>
  );
}

// ─── Trigger chip ─────────────────────────────────────────────────────────────

function TriggerChip({ trigger }: { trigger: Record<string, string> }) {
  const type = trigger?.type ?? "manual";
  const labels: Record<string, string> = {
    manual: "Manual trigger", schedule: "Scheduled", email: "Email trigger",
    webhook: "Webhook", event: "Event-based",
  };
  return (
    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
      style={{ background: "rgba(56,189,248,0.1)", color: "var(--accent)", border: "1px solid rgba(56,189,248,0.2)" }}>
      <Zap size={10} /> {labels[type] ?? type}
    </span>
  );
}

// ─── Step card ────────────────────────────────────────────────────────────────

function StepCard({ step, index }: { step: Workflow["steps"][number]; index: number }) {
  const [open, setOpen] = useState(false);
  const { color, Icon } = integrationMeta(step.integration);
  const paramEntries = Object.entries(step.params ?? {}).filter(([k]) => !k.startsWith("_"));

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.06 * index }}
      style={{
        display: "flex",
        gap: 16,
        alignItems: "flex-start",
      }}
    >
      {/* Timeline spine */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 2 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: color + "18", border: `1px solid ${color}35`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={16} style={{ color }} />
        </div>
        {/* Spine line — not on last item */}
        <div style={{ width: 1, flex: 1, minHeight: 16, background: "var(--border)", marginTop: 4 }} />
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "14px 16px",
        marginBottom: 12,
        cursor: paramEntries.length > 0 ? "pointer" : "default",
      }}
        onClick={() => paramEntries.length > 0 && setOpen((v) => !v)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
            background: color + "20", color,
          }}>
            {step.integration.toUpperCase()}
          </span>
          <span style={{ fontSize: 11, color: "var(--fg-subtle)" }}>Step {index + 1}</span>
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", marginBottom: 2 }}>
          {step.action}
        </p>

        <AnimatePresence>
          {open && paramEntries.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: "hidden" }}
            >
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
                {paramEntries.map(([k, v]) => (
                  <div key={k} style={{ display: "flex", gap: 8, fontSize: 12 }}>
                    <span style={{ color: "var(--fg-subtle)", minWidth: 80, flexShrink: 0 }}>{k}</span>
                    <span style={{ color: "var(--fg-muted)", wordBreak: "break-all" }}>{String(v)}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {paramEntries.length > 0 && (
          <p style={{ fontSize: 11, color: "var(--fg-subtle)", marginTop: 6 }}>
            {open ? "▲ Hide params" : `▼ ${paramEntries.length} param${paramEntries.length !== 1 ? "s" : ""}`}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkflowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [wf, setWf] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/workflows/${id}`)
      .then((r) => setWf(r.data))
      .catch(() => navigate("/dashboard", { replace: true }))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  async function handlePause() {
    if (!wf) return;
    setBusy(true);
    try {
      const res = await api.patch(`/workflows/${wf.id}/pause`);
      setWf((prev) => prev ? { ...prev, status: res.data.status } : prev);
    } finally { setBusy(false); }
  }

  async function handleActivate() {
    if (!wf) return;
    setBusy(true);
    try {
      const res = await api.patch(`/workflows/${wf.id}/activate`);
      setWf((prev) => prev ? { ...prev, status: res.data.status } : prev);
    } finally { setBusy(false); }
  }

  async function handleDelete() {
    if (!wf) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setBusy(true);
    try {
      await api.delete(`/workflows/${wf.id}`);
      navigate("/dashboard");
    } finally { setBusy(false); }
  }

  function relativeDate(iso: string | null) {
    if (!iso) return "Never";
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <motion.div animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ repeat: Infinity, duration: 1.4 }}
        style={{ width: 48, height: 48, borderRadius: 12, background: "var(--surface)" }} />
    </div>
  );

  if (!wf) return null;

  const isPaused = wf.status === "paused";
  const isActive = wf.status === "active";
  const isDraft  = wf.status === "draft";

  return (
    <div className="min-h-screen px-4 py-14" style={{ background: "var(--bg)" }}>
      {/* Glow */}
      <div style={{
        position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
        width: 700, height: 320,
        background: "radial-gradient(ellipse at top, rgba(139,92,246,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div className="max-w-2xl mx-auto">

        {/* Back */}
        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1.5 text-xs mb-6 transition-colors"
          style={{ color: "var(--fg-muted)" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--fg)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--fg-muted)")}
        >
          <ArrowLeft size={13} /> Dashboard
        </motion.button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <StatusBadge status={wf.status} />
                <TriggerChip trigger={wf.trigger} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--fg)" }}>
                {wf.name}
              </h1>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-6 mt-4 text-xs flex-wrap" style={{ color: "var(--fg-muted)" }}>
            <span className="flex items-center gap-1.5">
              <Zap size={11} style={{ color: "var(--accent)" }} />
              {wf.run_count} run{wf.run_count !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={11} />
              Last run: {relativeDate(wf.last_run_at)}
            </span>
            <span className="flex items-center gap-1.5">
              <FileText size={11} />
              Created {relativeDate(wf.created_at)}
            </span>
            <span className="flex items-center gap-1.5">
              <Settings size={11} />
              {wf.steps.length} step{wf.steps.length !== 1 ? "s" : ""}
            </span>
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex gap-2 flex-wrap mb-8"
        >
          {/* Run test */}
          <button
            onClick={() => navigate(`/workflow/test?id=${wf.id}`)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: "var(--accent)", color: "#000" }}
          >
            <Play size={13} /> Run test
          </button>

          {/* History */}
          <button
            onClick={() => navigate(`/workflow/${wf.id}/history`)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "var(--surface)", color: "var(--fg)", border: "1px solid var(--border)" }}
          >
            <History size={13} /> History
          </button>

          {/* Activate (if draft) */}
          {isDraft && (
            <button
              onClick={handleActivate}
              disabled={busy}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "#22c55e18", color: "#22c55e", border: "1px solid #22c55e30", opacity: busy ? 0.5 : 1 }}
            >
              <CheckCircle size={13} /> Activate
            </button>
          )}

          {/* Pause / Resume */}
          {(isActive || isPaused) && (
            <button
              onClick={handlePause}
              disabled={busy}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{
                background: isPaused ? "#22c55e18" : "#f59e0b18",
                color: isPaused ? "#22c55e" : "#f59e0b",
                border: `1px solid ${isPaused ? "#22c55e30" : "#f59e0b30"}`,
                opacity: busy ? 0.5 : 1,
              }}
            >
              {isPaused ? <><Play size={13} /> Resume</> : <><Pause size={13} /> Pause</>}
            </button>
          )}

          {/* Delete */}
          <button
            onClick={handleDelete}
            disabled={busy}
            onMouseLeave={() => setConfirmDelete(false)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{
              background: confirmDelete ? "#ef444418" : "var(--surface)",
              color: confirmDelete ? "#ef4444" : "var(--fg-muted)",
              border: `1px solid ${confirmDelete ? "#ef444430" : "var(--border)"}`,
              opacity: busy ? 0.5 : 1,
            }}
          >
            <Trash2 size={13} />
            {confirmDelete ? "Confirm delete" : "Delete"}
          </button>
        </motion.div>

        {/* Original description + trigger filter */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 14, padding: "18px 20px", marginBottom: 32,
          }}
        >
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--fg-subtle)" }}>
            ORIGINAL DESCRIPTION
          </p>
          <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--fg-muted)" }}>
            {wf.raw_input}
          </p>

          {/* Show trigger filter if email trigger */}
          {wf.trigger?.type === "email" && (
            <>
              <div style={{ height: 1, background: "var(--border)", margin: "12px 0" }} />
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--fg-subtle)" }}>
                EMAIL TRIGGER FILTER
              </p>
              <div className="flex flex-wrap gap-2">
                {wf.trigger.config?.from_email ? (
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: "#EA433518", color: "#EA4335", border: "1px solid #EA433530" }}>
                    from: {wf.trigger.config.from_email}
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: "var(--surface2)", color: "var(--fg-subtle)", border: "1px solid var(--border)" }}>
                    from: any sender
                  </span>
                )}
                {wf.trigger.config?.subject_contains ? (
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: "#38bdf818", color: "var(--accent)", border: "1px solid #38bdf830" }}>
                    subject contains: {wf.trigger.config.subject_contains}
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: "var(--surface2)", color: "var(--fg-subtle)", border: "1px solid var(--border)" }}>
                    subject: any
                  </span>
                )}
                <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: "#22c55e18", color: "#22c55e", border: "1px solid #22c55e30" }}>
                  checks every 5 min
                </span>
              </div>
            </>
          )}
        </motion.div>

        {/* Steps */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <p className="text-xs font-semibold mb-4" style={{ color: "var(--fg-subtle)" }}>
            WORKFLOW STEPS
          </p>

          {wf.steps.length === 0 ? (
            <div className="text-center py-10" style={{ color: "var(--fg-muted)", fontSize: 13 }}>
              No steps defined.
            </div>
          ) : (
            <div>
              {wf.steps.map((step, i) => (
                <StepCard key={step.step_id} step={step} index={i} />
              ))}
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}
