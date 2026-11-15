import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, CheckCircle, XCircle, Clock, ChevronDown, ChevronRight,
  Zap, AlertCircle,
} from "lucide-react";
import api from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StepLog {
  step_index: number;
  integration: string;
  status: "running" | "success" | "failed";
  error_message: string | null;
  duration_ms: number | null;
  output: Record<string, unknown> | null;
}

interface RunRecord {
  id: string;
  status: "running" | "success" | "failed" | "partial";
  started_at: string | null;
  completed_at: string | null;
  steps: StepLog[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INTEGRATION_COLORS: Record<string, string> = {
  gmail: "#EA4335", slack: "#E01E5A", sheets: "#34A853",
  notion: "#9b8afb", http: "#38bdf8", internal: "#94a3b8",
};

function integrationColor(name: string) {
  return INTEGRATION_COLORS[name.toLowerCase()] ?? "#94a3b8";
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function duration(start: string | null, end: string | null) {
  if (!start || !end) return null;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// ─── Step row ─────────────────────────────────────────────────────────────────

function StepRow({ step }: { step: StepLog }) {
  const [open, setOpen] = useState(false);
  const color = integrationColor(step.integration);
  const success = step.status === "success";

  return (
    <div style={{ borderBottom: "1px solid var(--border)" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-black/5 transition-colors"
        style={{ background: "transparent" }}
      >
        {success
          ? <CheckCircle size={13} style={{ color: "#22c55e", flexShrink: 0 }} />
          : <XCircle size={13} style={{ color: "#ef4444", flexShrink: 0 }} />
        }
        <span
          className="text-xs font-semibold px-1.5 py-0.5 rounded"
          style={{ background: color + "20", color }}
        >
          {step.integration}
        </span>
        <span className="flex-1 text-xs truncate" style={{ color: "var(--fg-muted)" }}>
          Step {step.step_index + 1}
          {step.error_message ? ` — ${step.error_message}` : ""}
        </span>
        {step.duration_ms != null && (
          <span className="text-xs" style={{ color: "var(--fg-subtle)" }}>
            {step.duration_ms}ms
          </span>
        )}
        {open ? <ChevronDown size={12} style={{ color: "var(--fg-subtle)" }} />
               : <ChevronRight size={12} style={{ color: "var(--fg-subtle)" }} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden" }}
          >
            <pre
              className="px-4 py-3 text-xs overflow-x-auto"
              style={{
                color: "var(--fg-muted)",
                background: "var(--surface2, var(--surface))",
                margin: 0,
              }}
            >
              {JSON.stringify(step.output ?? { error: step.error_message }, null, 2)}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Run row ──────────────────────────────────────────────────────────────────

function RunRow({ run, index }: { run: RunRecord; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const success = run.status === "success";
  const dur = duration(run.started_at, run.completed_at);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 * index }}
      style={{
        background: "var(--surface)",
        border: `1px solid ${success ? "#22c55e30" : run.status === "running" ? "var(--border)" : "#ef444430"}`,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
        style={{ background: "transparent" }}
      >
        {success
          ? <CheckCircle size={16} style={{ color: "#22c55e", flexShrink: 0 }} />
          : run.status === "running"
          ? <Clock size={16} style={{ color: "#38bdf8", flexShrink: 0 }} />
          : <XCircle size={16} style={{ color: "#ef4444", flexShrink: 0 }} />
        }
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
              Run #{index + 1}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{
                background: success ? "#22c55e18" : run.status === "running" ? "#38bdf818" : "#ef444418",
                color: success ? "#22c55e" : run.status === "running" ? "#38bdf8" : "#ef4444",
              }}
            >
              {run.status}
            </span>
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>
            {formatDate(run.started_at)}{dur ? ` · ${dur}` : ""}
            {" · "}{run.steps.length} step{run.steps.length !== 1 ? "s" : ""}
          </div>
        </div>
        {open
          ? <ChevronDown size={14} style={{ color: "var(--fg-subtle)" }} />
          : <ChevronRight size={14} style={{ color: "var(--fg-subtle)" }} />
        }
      </button>

      {/* Steps */}
      <AnimatePresence>
        {open && run.steps.length > 0 && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            style={{ overflow: "hidden", borderTop: "1px solid var(--border)" }}
          >
            {run.steps.map((s) => (
              <StepRow key={s.step_index} step={s} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RunHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [workflowName, setWorkflowName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get(`/workflows/${id}`),
      api.get(`/workflows/${id}/runs`),
    ]).then(([wfRes, runsRes]) => {
      setWorkflowName(wfRes.data.name);
      setRuns(runsRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen px-4 py-14" style={{ background: "var(--bg)" }}>
      {/* Glow */}
      <div style={{
        position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
        width: 600, height: 260,
        background: "radial-gradient(ellipse at top, rgba(139,92,246,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 text-xs mb-5 transition-colors"
            style={{ color: "var(--fg-muted)" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--fg)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--fg-muted)")}
          >
            <ArrowLeft size={13} /> Dashboard
          </button>

          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} style={{ color: "var(--accent)" }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
              Run History
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--fg)" }}>
            {workflowName || "Workflow"}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--fg-muted)" }}>
            {runs.length > 0 ? `${runs.length} run${runs.length !== 1 ? "s" : ""}` : "No runs yet"}
          </p>
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                style={{ height: 68, borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)" }}
              />
            ))}
          </div>
        ) : runs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <AlertCircle size={28} style={{ color: "var(--fg-subtle)", margin: "0 auto 12px" }} />
            <p className="text-sm" style={{ color: "var(--fg-muted)" }}>No runs recorded yet.</p>
            <button
              onClick={() => navigate(`/workflow/test?id=${id}`)}
              className="mt-4 text-sm font-semibold"
              style={{ color: "var(--accent)" }}
            >
              Run a test →
            </button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {runs.map((run, i) => (
              <RunRow key={run.id} run={run} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
