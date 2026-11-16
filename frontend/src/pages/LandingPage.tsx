import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Mail, MessageSquare, FileSpreadsheet, BookOpen, ArrowRight, CheckCircle, Play, Sparkles, GitBranch } from "lucide-react";

// ─── Animated workflow demo ───────────────────────────────────────────────────

const DEMO_STEPS = [
  { integration: "gmail",  label: "Read unread emails",          color: "#EA4335", delay: 0.6 },
  { integration: "notion", label: "Create task in Notion",       color: "#a78bfa", delay: 1.4 },
  { integration: "slack",  label: "Notify team on Slack",        color: "#E01E5A", delay: 2.2 },
];

function WorkflowDemo() {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setVisible((v) => (v + 1) % (DEMO_STEPS.length + 1)), 900);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.6 }}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 20,
        padding: "24px 28px",
        maxWidth: 420,
        width: "100%",
        boxShadow: "0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(56,189,248,0.08)",
      }}
    >
      {/* Input */}
      <div
        style={{
          background: "var(--surface2)",
          border: "1px solid rgba(56,189,248,0.3)",
          borderRadius: 10,
          padding: "10px 14px",
          marginBottom: 20,
          fontSize: 13,
          color: "var(--fg-muted)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Sparkles size={13} style={{ color: "var(--accent)", flexShrink: 0 }} />
        <span>When I get an email, create a Notion task and alert Slack</span>
      </div>

      {/* Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {DEMO_STEPS.map((step, i) => (
          <AnimatePresence key={step.integration}>
            {visible > i && (
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  borderRadius: 9,
                  background: step.color + "12",
                  border: `1px solid ${step.color}30`,
                }}
              >
                <CheckCircle size={13} style={{ color: step.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "var(--fg)", fontWeight: 500 }}>
                  {step.label}
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 10,
                    fontWeight: 600,
                    padding: "2px 7px",
                    borderRadius: 20,
                    background: step.color + "20",
                    color: step.color,
                  }}
                >
                  {step.integration}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        ))}
      </div>

      {visible > DEMO_STEPS.length - 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            marginTop: 14,
            fontSize: 11,
            color: "#22c55e",
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontWeight: 600,
          }}
        >
          <CheckCircle size={11} /> Workflow running · 3 steps active
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── Integration logos strip ──────────────────────────────────────────────────

const INTEGRATIONS = [
  { name: "Gmail",          Icon: Mail,            color: "#EA4335" },
  { name: "Slack",          Icon: MessageSquare,   color: "#E01E5A" },
  { name: "Google Sheets",  Icon: FileSpreadsheet, color: "#34A853" },
  { name: "Notion",         Icon: BookOpen,        color: "#a78bfa" },
];

// ─── How it works ─────────────────────────────────────────────────────────────

const HOW_STEPS = [
  {
    num: "01",
    title: "Describe in plain English",
    desc: "Tell FlowMind what you want to automate — no technical jargon, no flowcharts.",
    icon: Sparkles,
  },
  {
    num: "02",
    title: "AI builds the workflow",
    desc: "Our AI decomposes your request into precise steps and connects the right integrations.",
    icon: GitBranch,
  },
  {
    num: "03",
    title: "Runs automatically",
    desc: "Test it, activate it, and let FlowMind handle the repetitive work while you focus on what matters.",
    icon: Zap,
  },
];

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Sparkles,
    color: "#38bdf8",
    title: "Natural language input",
    desc: "Just describe what you want. No drag-and-drop builders, no YAML, no code.",
  },
  {
    icon: GitBranch,
    color: "#a78bfa",
    title: "AI step decomposition",
    desc: "Claude AI breaks your request into structured, executable steps automatically.",
  },
  {
    icon: Zap,
    color: "#fbbf24",
    title: "Real-time execution",
    desc: "Watch each step run live with a streaming log — no black box, full transparency.",
  },
  {
    icon: CheckCircle,
    color: "#34d399",
    title: "4 integrations built-in",
    desc: "Gmail, Slack, Google Sheets and Notion work out of the box. No API keys to manage.",
  },
];

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar({ onLogin, onStart }: { onLogin: () => void; onStart: () => void }) {
  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: "0 24px",
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(12,15,26,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(42,50,81,0.6)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Zap size={18} style={{ color: "var(--accent)" }} />
        <span style={{ fontWeight: 700, fontSize: 15, color: "var(--fg)" }}>FlowMind</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          onClick={onLogin}
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            color: "var(--fg-muted)",
            padding: "7px 18px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            transition: "color 0.15s, border-color 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--fg)";
            (e.currentTarget as HTMLElement).style.borderColor = "var(--fg-subtle)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--fg-muted)";
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
          }}
        >
          Log in
        </button>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onStart}
          style={{
            background: "var(--accent)",
            color: "#000",
            padding: "7px 18px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
          }}
        >
          Get started free
        </motion.button>
      </div>
    </nav>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", overflowX: "hidden" }}>
      <Navbar onLogin={() => navigate("/login")} onStart={() => navigate("/register")} />

      {/* ── Hero ── */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 24px 60px",
          position: "relative",
        }}
      >
        {/* Background glows */}
        <div style={{
          position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
          width: 800, height: 500,
          background: "radial-gradient(ellipse at top, rgba(56,189,248,0.09) 0%, transparent 65%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", top: "30%", left: "10%",
          width: 400, height: 400,
          background: "radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ maxWidth: 1100, width: "100%", display: "flex", alignItems: "center", gap: 64, flexWrap: "wrap", justifyContent: "center" }}>
          {/* Left text */}
          <div style={{ flex: "1 1 420px", maxWidth: 520 }}>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "5px 14px",
                  borderRadius: 999,
                  background: "rgba(56,189,248,0.1)",
                  border: "1px solid rgba(56,189,248,0.25)",
                  marginBottom: 24,
                }}
              >
                <Sparkles size={12} style={{ color: "var(--accent)" }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)" }}>
                  Powered by Claude AI
                </span>
              </div>

              <h1 style={{ fontSize: "clamp(2.4rem, 5vw, 3.6rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 20 }}>
                <span style={{
                  background: "linear-gradient(135deg, #38bdf8 0%, #a78bfa 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  Describe it.
                </span>
                <br />
                <span style={{ color: "var(--fg)" }}>We automate it.</span>
              </h1>

              <p style={{ fontSize: 17, lineHeight: 1.65, color: "var(--fg-muted)", marginBottom: 36, maxWidth: 440 }}>
                Tell FlowMind what you want to automate in plain English.
                AI builds the workflow, connects your apps, and runs it — no code required.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate("/register")}
                  style={{
                    background: "var(--accent)",
                    color: "#000",
                    padding: "13px 28px",
                    borderRadius: 10,
                    fontSize: 15,
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  Start for free <ArrowRight size={15} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate("/login")}
                  style={{
                    background: "transparent",
                    color: "var(--fg-muted)",
                    padding: "13px 28px",
                    borderRadius: 10,
                    fontSize: 15,
                    fontWeight: 600,
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Play size={13} /> See it live
                </motion.button>
              </div>

              <p style={{ marginTop: 16, fontSize: 12, color: "var(--fg-subtle)" }}>
                No credit card · No setup · Works in minutes
              </p>
            </motion.div>
          </div>

          {/* Right demo card */}
          <div style={{ flex: "1 1 320px", display: "flex", justifyContent: "center" }}>
            <WorkflowDemo />
          </div>
        </div>
      </section>

      {/* ── Integrations strip ── */}
      <section style={{ padding: "48px 24px", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", color: "var(--fg-subtle)", marginBottom: 28, textTransform: "uppercase" }}>
            Works with the tools you already use
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 40, flexWrap: "wrap" }}>
            {INTEGRATIONS.map(({ name, Icon, color }) => (
              <motion.div
                key={name}
                whileHover={{ y: -3 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: color + "15",
                  border: `1px solid ${color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={22} style={{ color }} />
                </div>
                <span style={{ fontSize: 11, color: "var(--fg-muted)", fontWeight: 500 }}>{name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ padding: "96px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{ textAlign: "center", marginBottom: 64 }}
          >
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", color: "var(--accent)", marginBottom: 12, textTransform: "uppercase" }}>
              How it works
            </p>
            <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--fg)" }}>
              From idea to automation in minutes
            </h2>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 32 }}>
            {HOW_STEPS.map(({ num, title, desc, icon: Icon }, i) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 16,
                  padding: "32px 28px",
                  position: "relative",
                }}
              >
                <div style={{
                  position: "absolute", top: 20, right: 20,
                  fontSize: 11, fontWeight: 700, color: "var(--border)",
                  letterSpacing: "0.05em",
                }}>
                  {num}
                </div>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: "rgba(56,189,248,0.1)",
                  border: "1px solid rgba(56,189,248,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 20,
                }}>
                  <Icon size={20} style={{ color: "var(--accent)" }} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--fg)", marginBottom: 10 }}>{title}</h3>
                <p style={{ fontSize: 13, lineHeight: 1.65, color: "var(--fg-muted)" }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: "0 24px 96px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 64 }}
          >
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", color: "var(--accent)", marginBottom: 12, textTransform: "uppercase" }}>
              Features
            </p>
            <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--fg)" }}>
              Built for the way you actually work
            </h2>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 }}>
            {FEATURES.map(({ icon: Icon, color, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 14,
                  padding: "26px 22px",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = color + "50";
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 24px ${color}12`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: color + "15",
                  border: `1px solid ${color}25`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 16,
                }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--fg)", marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 12, lineHeight: 1.65, color: "var(--fg-muted)" }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ padding: "0 24px 96px" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            maxWidth: 680,
            margin: "0 auto",
            textAlign: "center",
            background: "linear-gradient(135deg, rgba(56,189,248,0.07) 0%, rgba(167,139,250,0.07) 100%)",
            border: "1px solid rgba(56,189,248,0.15)",
            borderRadius: 24,
            padding: "64px 40px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{
            position: "absolute", top: "-40%", left: "50%", transform: "translateX(-50%)",
            width: 400, height: 300,
            background: "radial-gradient(ellipse, rgba(56,189,248,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
          <Zap size={28} style={{ color: "var(--accent)", marginBottom: 20 }} />
          <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--fg)", marginBottom: 14 }}>
            Ready to automate your work?
          </h2>
          <p style={{ fontSize: 15, color: "var(--fg-muted)", marginBottom: 36, lineHeight: 1.6 }}>
            Connect your tools in 2 minutes and let AI handle the repetitive tasks.
          </p>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/register")}
            style={{
              background: "var(--accent)",
              color: "#000",
              padding: "14px 36px",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            Get started free <ArrowRight size={15} />
          </motion.button>
          <p style={{ marginTop: 16, fontSize: 12, color: "var(--fg-subtle)" }}>
            No credit card required
          </p>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "28px 24px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
          <Zap size={14} style={{ color: "var(--accent)" }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--fg)" }}>FlowMind</span>
        </div>
        <p style={{ fontSize: 12, color: "var(--fg-subtle)" }}>
          AI-powered workflow automation · Built with Claude
        </p>
      </footer>
    </div>
  );
}
