import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Zap, Clock, CheckCircle, PauseCircle, AlertCircle, Play, Pause, Trash2, History } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import api, { type Workflow } from "@/lib/api";

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Workflow["status"] }) {
  const configs = {
    active:  { color: "#22c55e", bg: "#22c55e18", Icon: CheckCircle,  label: "Active" },
    draft:   { color: "#94a3b8", bg: "#94a3b818", Icon: Clock,        label: "Draft" },
    paused:  { color: "#f59e0b", bg: "#f59e0b18", Icon: PauseCircle,  label: "Paused" },
    failed:  { color: "#ef4444", bg: "#ef444418", Icon: AlertCircle,  label: "Failed" },
  };
  const { color, bg, Icon, label } = configs[status] ?? configs.draft;

  return (
    <span
      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: bg, color }}
    >
      <Icon size={10} />
      {label}
    </span>
  );
}

// ─── Workflow card ────────────────────────────────────────────────────────────

function WorkflowCard({
  wf,
  index,
  onDelete,
  onTogglePause,
}: {
  wf: Workflow;
  index: number;
  onDelete: (id: string) => void;
  onTogglePause: (id: string, newStatus: Workflow["status"]) => void;
}) {
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const relativeDate = (iso: string | null) => {
    if (!iso) return "Never";
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setBusy(true);
    try {
      await api.delete(`/workflows/${wf.id}`);
      onDelete(wf.id);
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  async function handlePause(e: React.MouseEvent) {
    e.stopPropagation();
    setBusy(true);
    try {
      const res = await api.patch(`/workflows/${wf.id}/pause`);
      onTogglePause(wf.id, res.data.status);
    } finally {
      setBusy(false);
    }
  }

  const isPaused = wf.status === "paused";
  const isActive = wf.status === "active";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
      transition={{ delay: 0.05 * index }}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: "18px 20px",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(139,92,246,0.4)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(139,92,246,0.08)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
        setConfirmDelete(false);
      }}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left — name + meta */}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => navigate(`/workflow/${wf.id}`)}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="font-semibold text-sm truncate" style={{ color: "var(--fg)" }}>
              {wf.name}
            </h3>
            <StatusBadge status={wf.status} />
          </div>
          <div className="flex items-center gap-4 text-xs" style={{ color: "var(--fg-muted)" }}>
            <span className="flex items-center gap-1">
              <Zap size={10} />
              {wf.run_count} run{wf.run_count !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={10} />
              Last run: {relativeDate(wf.last_run_at)}
            </span>
            <span>Created {relativeDate(wf.created_at)}</span>
          </div>
        </div>

        {/* Right — actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Run history */}
          <button
            onClick={() => navigate(`/workflow/${wf.id}/history`)}
            title="Run history"
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--fg-muted)" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--fg)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--fg-muted)")}
          >
            <History size={15} />
          </button>

          {/* Test run */}
          <button
            onClick={() => navigate(`/workflow/test?id=${wf.id}`)}
            title="Run test"
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--fg-muted)" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--accent)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--fg-muted)")}
          >
            <Play size={15} />
          </button>

          {/* Pause / Resume — only for active or paused workflows */}
          {(isActive || isPaused) && (
            <button
              onClick={handlePause}
              disabled={busy}
              title={isPaused ? "Resume" : "Pause"}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: isPaused ? "#22c55e" : "#f59e0b", opacity: busy ? 0.5 : 1 }}
            >
              {isPaused ? <Play size={15} /> : <Pause size={15} />}
            </button>
          )}

          {/* Delete */}
          <button
            onClick={handleDelete}
            disabled={busy}
            title={confirmDelete ? "Click again to confirm" : "Delete"}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: confirmDelete ? "#ef4444" : "var(--fg-muted)", opacity: busy ? 0.5 : 1 }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#ef4444")}
            onMouseLeave={(e) => {
              if (!confirmDelete)
                (e.currentTarget as HTMLElement).style.color = "var(--fg-muted)";
            }}
          >
            <Trash2 size={15} />
          </button>

          {confirmDelete && (
            <span className="text-xs font-semibold" style={{ color: "#ef4444" }}>
              Click again
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-24"
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
        style={{
          background: "rgba(139,92,246,0.12)",
          border: "1px solid rgba(139,92,246,0.25)",
        }}
      >
        <Zap size={28} style={{ color: "var(--accent)" }} />
      </div>
      <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--fg)" }}>
        No workflows yet
      </h2>
      <p className="text-sm mb-6" style={{ color: "var(--fg-muted)" }}>
        Describe what you want to automate in plain English
        <br />
        and FlowMind AI will build it for you.
      </p>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onNew}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold"
        style={{ background: "var(--accent)", color: "#000" }}
      >
        <Plus size={15} />
        Create my first workflow
      </motion.button>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMe();
    api
      .get("/workflows")
      .then((r) => setWorkflows(r.data))
      .catch(() => setWorkflows([]))
      .finally(() => setLoading(false));
  }, [fetchMe]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  function handleDelete(id: string) {
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
  }

  function handleTogglePause(id: string, newStatus: Workflow["status"]) {
    setWorkflows((prev) => prev.map((w) => w.id === id ? { ...w, status: newStatus } : w));
  }

  return (
    <div className="min-h-screen px-4 py-10" style={{ background: "var(--bg)" }}>
      {/* Background glow */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 700,
          height: 300,
          background: "radial-gradient(ellipse at top, rgba(139,92,246,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div className="max-w-3xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="text-xs font-semibold mb-1" style={{ color: "var(--accent)" }}>
              FlowMind
            </div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>
              {greeting()}{user?.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--fg-muted)" }}>
              {workflows.length > 0
                ? `You have ${workflows.length} workflow${workflows.length > 1 ? "s" : ""}`
                : "Let's build your first automation"}
            </p>
          </div>

          {workflows.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/workflow/create")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "var(--accent)", color: "#000" }}
            >
              <Plus size={15} />
              New Workflow
            </motion.button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.15 }}
                style={{
                  height: 76,
                  borderRadius: 14,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              />
            ))}
          </div>
        ) : workflows.length === 0 ? (
          <EmptyState onNew={() => navigate("/workflow/create")} />
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
              {workflows.map((wf, i) => (
                <WorkflowCard
                  key={wf.id}
                  wf={wf}
                  index={i}
                  onDelete={handleDelete}
                  onTogglePause={handleTogglePause}
                />
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* Settings link */}
        <div className="mt-12 text-center">
          <button
            onClick={() => navigate("/settings")}
            className="text-xs transition-colors"
            style={{ color: "var(--fg-subtle)" }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "var(--fg-muted)")}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "var(--fg-subtle)")}
          >
            Settings · Integrations · Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
