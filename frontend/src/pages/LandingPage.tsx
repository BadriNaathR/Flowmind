import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-2xl"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-6"
          style={{ background: "var(--accent-soft)", color: "var(--accent)", border: "1px solid var(--accent)" }}>
          AI Workflow Automation
        </div>

        <h1 className="text-5xl font-bold tracking-tight mb-4 leading-tight">
          <span className="text-gradient">Describe it.</span>
          <br />
          We automate it.
        </h1>

        <p className="text-lg mb-8" style={{ color: "var(--fg-muted)" }}>
          Tell FlowMind what you want to automate in plain English.
          AI agents build, run, and manage the workflow — no code required.
        </p>

        <button className="btn-primary text-lg px-8 py-3 rounded-xl" onClick={() => navigate("/login")}>
          Start Automating Free
        </button>

        <p className="text-sm mt-4" style={{ color: "var(--fg-subtle)" }}>
          Sprint 1 — Full landing page coming soon
        </p>
      </motion.div>
    </div>
  );
}
