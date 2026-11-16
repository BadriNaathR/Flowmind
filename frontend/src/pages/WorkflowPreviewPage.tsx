import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Zap,
  ArrowRight,
  Mail,
  MessageSquare,
  Table,
  FileText,
  Globe,
  Cpu,
  Clock,
  Webhook,
  Play,
  MousePointer,
} from "lucide-react";
import api, { type Workflow } from "@/lib/api";

// ─── Integration icon map ─────────────────────────────────────────────────────

function IntegrationIcon({ name }: { name: string }) {
  const cls = "w-4 h-4";
  switch (name) {
    case "gmail":   return <Mail className={cls} />;
    case "slack":   return <MessageSquare className={cls} />;
    case "sheets":  return <Table className={cls} />;
    case "notion":  return <FileText className={cls} />;
    case "http":    return <Globe className={cls} />;
    default:        return <Cpu className={cls} />;
  }
}

function TriggerIcon({ type }: { type: string }) {
  switch (type) {
    case "schedule": return <Clock size={16} />;
    case "webhook":  return <Webhook size={16} />;
    case "manual":   return <MousePointer size={16} />;
    case "email":    return <Mail size={16} />;
    default:         return <Play size={16} />;
  }
}

const INTEGRATION_COLORS: Record<string, string> = {
  gmail:    "#EA4335",
  slack:    "#E01E5A",
  sheets:   "#34A853",
  notion:   "#9b8afb",
  http:     "#38bdf8",
  internal: "#fb923c",
};

// ─── Step card ────────────────────────────────────────────────────────────────

function StepCard({
  step,
  index,
  total,
}: {
  step: Workflow["steps"][0];
  index: number;
  total: number;
}) {
  const color = INTEGRATION_COLORS[step.integration] ?? "#888";
  const isLast = index === total - 1;

  return (
    <div className="relative flex gap-4">
      {/* Connector line */}
      {!isLast && (
        <div
          style={{
            position: "absolute",
            left: 19,
            top: 44,
            width: 2,
            bottom: -16,
            background: "linear-gradient(to bottom, var(--border), transparent)",
          }}
        />
      )}

      {/* Step number circle */}
      <div
        className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold"
        style={{
          background: `${color}20`,
          border: `1.5px solid ${color}50`,
          color,
          zIndex: 1,
        }}
      >
        {index + 1}
      </div>

      {/* Card content */}
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.08 * index }}
        className="flex-1 mb-4"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "14px 16px",
        }}
      >
        {/* Integration badge */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: `${color}18`, color }}
          >
            <IntegrationIcon name={step.integration} />
            {step.integration}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              background: "var(--surface2)",
              color: "var(--fg-muted)",
              border: "1px solid var(--border)",
            }}
          >
            {step.type}
          </span>
        </div>

        {/* Action */}
        <p className="text-sm font-medium mb-1" style={{ color: "var(--fg)" }}>
          {step.action}
        </p>

        {/* Params */}
        {Object.keys(step.params).length > 0 && (
          <div className="mt-2 space-y-0.5">
            {Object.entries(step.params).map(([k, v]) => (
              <div key={k} className="text-xs" style={{ color: "var(--fg-muted)" }}>
                <span style={{ color: "var(--fg-subtle)" }}>{k}: </span>
                {String(v)}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkflowPreviewPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const workflowId = params.get("id");

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    if (!workflowId) {
      navigate("/workflow/create", { replace: true });
      return;
    }
    api
      .get(`/workflows/${workflowId}`)
      .then((r) => setWorkflow(r.data))
      .catch(() => setError("Could not load the workflow. Please try again."))
      .finally(() => setLoading(false));
  }, [workflowId, navigate]);

  async function handleActivate() {
    if (!workflowId) return;
    setActivating(true);
    try {
      await api.patch(`/workflows/${workflowId}/activate`);
      setActivated(true);
      setTimeout(() => navigate("/dashboard"), 1200);
    } catch {
      setError("Could not activate the workflow.");
    } finally {
      setActivating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }}>
          <div className="text-sm" style={{ color: "var(--fg-muted)" }}>Loading workflow…</div>
        </motion.div>
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-sm mb-4" style={{ color: "var(--fg-muted)" }}>{error ?? "Workflow not found."}</p>
          <button
            onClick={() => navigate("/workflow/create")}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "var(--accent)", color: "#000" }}
          >
            ← Try again
          </button>
        </div>
      </div>
    );
  }

  const triggerType = workflow.trigger?.type ?? "manual";

  return (
    <div
      className="min-h-screen px-4 py-16"
      style={{ background: "var(--bg)" }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 600,
          height: 300,
          background: "radial-gradient(ellipse at top, rgba(56,189,248,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} style={{ color: "var(--accent)" }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
              AI Generated
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: "var(--fg)" }}>
            {workflow.name}
          </h1>
          <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
            "{workflow.raw_input}"
          </p>
        </motion.div>

        {/* Trigger card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-2xl flex items-center gap-3"
          style={{
            background: "var(--surface)",
            border: "1.5px solid rgba(139,92,246,0.3)",
            boxShadow: "0 0 24px rgba(139,92,246,0.08)",
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(139,92,246,0.15)", color: "var(--accent)" }}
          >
            <TriggerIcon type={triggerType} />
          </div>
          <div>
            <div className="text-xs font-medium mb-0.5" style={{ color: "var(--accent)" }}>
              Trigger
            </div>
            <div className="text-sm font-semibold capitalize" style={{ color: "var(--fg)" }}>
              {triggerType} trigger
            </div>
          </div>
          <ArrowRight size={14} style={{ color: "var(--fg-subtle)", marginLeft: "auto" }} />
        </motion.div>

        {/* AI Confidence score */}
        {workflow.confidence != null && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 p-4 rounded-2xl"
            style={{
              background: workflow.confidence >= 75
                ? "rgba(34,197,94,0.07)"
                : workflow.confidence >= 50
                ? "rgba(251,191,36,0.07)"
                : "rgba(239,68,68,0.07)",
              border: `1px solid ${workflow.confidence >= 75 ? "#22c55e30" : workflow.confidence >= 50 ? "#fbbf2430" : "#ef444430"}`,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: workflow.confidence >= 75 ? "#22c55e" : workflow.confidence >= 50 ? "#fbbf24" : "#ef4444" }}>
                AI Confidence
              </span>
              <span className="text-sm font-bold"
                style={{ color: workflow.confidence >= 75 ? "#22c55e" : workflow.confidence >= 50 ? "#fbbf24" : "#ef4444" }}>
                {workflow.confidence}%
              </span>
            </div>
            {/* Progress bar */}
            <div style={{ height: 4, background: "var(--border)", borderRadius: 999, marginBottom: 8 }}>
              <div style={{
                height: "100%", borderRadius: 999,
                width: `${workflow.confidence}%`,
                background: workflow.confidence >= 75 ? "#22c55e" : workflow.confidence >= 50 ? "#fbbf24" : "#ef4444",
                transition: "width 0.6s ease",
              }} />
            </div>
            {workflow.confidence_reason && (
              <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{workflow.confidence_reason}</p>
            )}
            {workflow.confidence < 70 && (
              <p className="text-xs font-semibold mt-1" style={{ color: "#fbbf24" }}>
                ⚠ AI is uncertain — review each step carefully before activating.
              </p>
            )}
          </motion.div>
        )}

        {/* Steps */}
        <div className="mb-8">
          {workflow.steps.map((step, i) => (
            <StepCard key={step.step_id} step={step} index={i} total={workflow.steps.length} />
          ))}
        </div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-3"
        >
          {activated ? (
            <div
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold"
              style={{ background: "#22c55e22", color: "#22c55e", border: "1px solid #22c55e44" }}
            >
              <CheckCircle size={16} />
              Workflow Activated — Redirecting…
            </div>
          ) : (
            <>
              <button
                onClick={() => navigate("/workflow/create")}
                className="flex-shrink-0 px-5 py-3.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
                style={{
                  background: "var(--surface)",
                  color: "var(--fg-muted)",
                  border: "1px solid var(--border)",
                }}
              >
                Regenerate
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/workflow/create/test?id=${workflowId}`)}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold"
                style={{
                  background: "var(--surface)",
                  color: "var(--fg)",
                  border: "1px solid var(--border)",
                }}
              >
                <Play size={14} />
                Test Run
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleActivate}
                disabled={activating}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold"
                style={{
                  background: "var(--accent)",
                  color: "#000",
                  opacity: activating ? 0.7 : 1,
                  cursor: activating ? "not-allowed" : "pointer",
                }}
              >
                {activating ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                      style={{ width: 14, height: 14, border: "2px solid #000", borderTopColor: "transparent", borderRadius: "50%" }}
                    />
                    Activating…
                  </>
                ) : (
                  <>
                    <Zap size={14} />
                    Activate
                  </>
                )}
              </motion.button>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
