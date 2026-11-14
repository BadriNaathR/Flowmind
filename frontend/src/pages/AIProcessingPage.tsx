import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";

const STAGES = [
  { label: "Reading your request…", duration: 800 },
  { label: "Identifying the right tools…", duration: 1000 },
  { label: "Planning the steps…", duration: 1000 },
  { label: "Finalising your workflow…", duration: 600 },
];

function SpinnerRing() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="28" stroke="var(--border)" strokeWidth="4" />
      <motion.circle
        cx="32"
        cy="32"
        r="28"
        stroke="var(--accent)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="40 136"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
        style={{ transformOrigin: "32px 32px" }}
      />
    </svg>
  );
}

export default function AIProcessingPage() {
  const navigate = useNavigate();
  const [stageIdx, setStageIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const rawInput = sessionStorage.getItem("wf_raw_input");
    if (!rawInput) {
      navigate("/workflow/create", { replace: true });
      return;
    }

    // Advance stage labels while API call runs
    let idx = 0;
    const advance = () => {
      idx++;
      if (idx < STAGES.length) {
        setStageIdx(idx);
      }
    };

    let elapsed = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const stage of STAGES.slice(0, -1)) {
      elapsed += stage.duration;
      timers.push(setTimeout(advance, elapsed));
    }

    // Fire the API call
    api
      .post("/workflows", { raw_input: rawInput })
      .then((res) => {
        timers.forEach(clearTimeout);
        setStageIdx(STAGES.length - 1);
        sessionStorage.removeItem("wf_raw_input");
        setTimeout(() => {
          navigate(`/workflow/create/preview?id=${res.data.id}`, { replace: true });
        }, 600);
      })
      .catch((err) => {
        timers.forEach(clearTimeout);
        const detail = err.response?.data?.detail ?? "AI service unavailable. Please try again.";
        setError(detail);
      });

    return () => timers.forEach(clearTimeout);
  }, [navigate]);

  if (error) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ background: "var(--bg)" }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm"
        >
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--fg)" }}>
            Something went wrong
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--fg-muted)" }}>
            {error}
          </p>
          <button
            onClick={() => navigate("/workflow/create")}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "var(--accent)", color: "#000" }}
          >
            ← Try again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "var(--bg)" }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "fixed",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 600,
          height: 600,
          background:
            "radial-gradient(ellipse, rgba(139,92,246,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        {/* Spinner */}
        <div className="flex justify-center mb-8">
          <SpinnerRing />
        </div>

        {/* Stage label */}
        <div style={{ minHeight: 56 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={stageIdx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--fg)" }}>
                {STAGES[stageIdx]?.label}
              </h2>
              <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
                FlowMind AI is building your workflow
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-8">
          {STAGES.map((_, i) => (
            <motion.div
              key={i}
              animate={{
                width: i === stageIdx ? 20 : 6,
                opacity: i <= stageIdx ? 1 : 0.3,
              }}
              transition={{ duration: 0.3 }}
              style={{
                height: 6,
                borderRadius: 99,
                background: "var(--accent)",
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
