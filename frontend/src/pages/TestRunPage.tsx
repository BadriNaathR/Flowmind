import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Zap,
  CheckCircle,
  XCircle,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import api from "@/lib/api";
import { useRunStream } from "@/hooks/useRunStream";
import { LogEntry } from "@/components/LogEntry";

export default function TestRunPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const workflowId = searchParams.get("id");

  const [runId, setRunId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);

  const { events, streamStatus } = useRunStream(runId);

  const runStartedEvent = events.find((e) => e.type === "run_started");
  const stepStartedEvents = events.filter((e) => e.type === "step_started");
  const isRunning = streamStatus === "running" || streamStatus === "connecting";
  const isCompleted = streamStatus === "completed";
  const isFailed = streamStatus === "failed";
  const hasRun = runId !== null;

  function getCompletionEvent(stepIndex: number) {
    return events.find(
      (e) =>
        (e.type === "step_completed" || e.type === "step_failed") &&
        e.step_index === stepIndex
    );
  }

  async function startRun() {
    if (!workflowId) return;
    setStarting(true);
    setStartError(null);
    try {
      const res = await api.post(`/workflows/${workflowId}/test`);
      setRunId(res.data.run_id as string);
    } catch {
      setStartError("Could not start the test run. Please try again.");
    } finally {
      setStarting(false);
    }
  }

  async function handleActivate() {
    if (!workflowId) return;
    setActivating(true);
    try {
      await api.patch(`/workflows/${workflowId}/activate`);
      navigate("/dashboard");
    } catch {
      setActivating(false);
    }
  }

  function handleRetry() {
    setRunId(null);
    setStartError(null);
  }

  useEffect(() => {
    if (!workflowId) navigate("/dashboard", { replace: true });
  }, [workflowId, navigate]);

  const totalSteps = runStartedEvent?.total_steps ?? 0;
  const completedSteps = events.filter(
    (e) => e.type === "step_completed" || e.type === "step_failed"
  ).length;
  const progressPct = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <div className="min-h-screen px-4 py-16" style={{ background: "var(--bg)" }}>
      {/* Background glow */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 600,
          height: 300,
          background:
            "radial-gradient(ellipse at top, rgba(56,189,248,0.07) 0%, transparent 70%)",
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
            <Play size={15} style={{ color: "var(--accent)" }} />
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--accent)" }}
            >
              Test Run
            </span>
          </div>
          <h1
            className="text-3xl font-bold tracking-tight mb-2"
            style={{ color: "var(--fg)" }}
          >
            {runStartedEvent?.workflow_name ?? "Workflow Test"}
          </h1>
          <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
            {!hasRun && "Run your workflow with simulated data to verify each step."}
            {isRunning && "Executing your workflow step by step…"}
            {isCompleted && "All steps completed successfully."}
            {isFailed && hasRun && "The workflow stopped due to an error."}
          </p>
        </motion.div>

        {/* Pre-run card */}
        <AnimatePresence>
          {!hasRun && (
            <motion.div
              key="pre-run"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-8 p-8 rounded-2xl text-center"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(56,189,248,0.12)", color: "var(--accent)" }}
              >
                <Play size={24} />
              </div>
              <p className="text-sm mb-6" style={{ color: "var(--fg-muted)" }}>
                Each step will execute with simulated data. Watch the results stream
                in real time.
              </p>
              {startError && (
                <p className="text-sm mb-4" style={{ color: "#ef4444" }}>
                  {startError}
                </p>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={startRun}
                disabled={starting}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold"
                style={{
                  background: "var(--accent)",
                  color: "#000",
                  opacity: starting ? 0.7 : 1,
                  cursor: starting ? "not-allowed" : "pointer",
                }}
              >
                {starting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                      style={{
                        width: 14,
                        height: 14,
                        border: "2px solid #000",
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                      }}
                    />
                    Starting…
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    Run Test
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress bar (while running) */}
        {hasRun && totalSteps > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--fg-muted)" }}>
              <span>{isRunning ? "Running…" : isCompleted ? "Complete" : "Stopped"}</span>
              <span>
                {completedSteps} / {totalSteps} steps
              </span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: "var(--border)" }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: isFailed
                    ? "#ef4444"
                    : "var(--accent)",
                }}
                initial={{ width: "0%" }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        )}

        {/* Step log entries */}
        {stepStartedEvents.length > 0 && (
          <div className="mb-6">
            {stepStartedEvents.map((step) => (
              <LogEntry
                key={step.step_index}
                stepEvent={step}
                completedEvent={getCompletionEvent(step.step_index!)}
              />
            ))}
          </div>
        )}

        {/* Result banner */}
        <AnimatePresence>
          {(isCompleted || isFailed) && (
            <motion.div
              key="result-banner"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 p-5 rounded-2xl flex items-center gap-4"
              style={{
                background: isCompleted ? "#22c55e18" : "#ef444418",
                border: `1px solid ${isCompleted ? "#22c55e44" : "#ef444444"}`,
              }}
            >
              {isCompleted ? (
                <CheckCircle size={22} style={{ color: "#22c55e" }} />
              ) : (
                <XCircle size={22} style={{ color: "#ef4444" }} />
              )}
              <div>
                <div
                  className="text-sm font-semibold"
                  style={{ color: isCompleted ? "#22c55e" : "#ef4444" }}
                >
                  {isCompleted ? "All steps passed" : "Test run failed"}
                </div>
                <div
                  className="text-xs mt-0.5"
                  style={{ color: "var(--fg-muted)" }}
                >
                  {isCompleted
                    ? `${stepStartedEvents.length} step${stepStartedEvents.length !== 1 ? "s" : ""} executed successfully`
                    : "Fix the issue and run the test again"}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() =>
              navigate(`/workflow/create/preview?id=${workflowId}`)
            }
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-3.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
            style={{
              background: "var(--surface)",
              color: "var(--fg-muted)",
              border: "1px solid var(--border)",
            }}
          >
            <ArrowLeft size={14} />
            Preview
          </button>

          {isFailed && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRetry}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold"
              style={{
                background: "var(--surface)",
                color: "var(--fg)",
                border: "1px solid var(--border)",
              }}
            >
              <RefreshCw size={14} />
              Try Again
            </motion.button>
          )}

          {isCompleted && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
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
                    style={{
                      width: 14,
                      height: 14,
                      border: "2px solid #000",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                    }}
                  />
                  Activating…
                </>
              ) : (
                <>
                  <Zap size={14} />
                  Activate Workflow
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
