import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Lightbulb } from "lucide-react";

const EXAMPLES = [
  "When I get a customer support email, summarize it and post to Slack #support",
  "Every Monday at 9am, pull last week's sales data from Sheets and email me a summary",
  "When a new Notion task is created, send a Slack message to the assignee",
  "If I receive an invoice email, extract the amount and log it to Google Sheets",
];

export default function CreateWorkflowPage() {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);

  function handleExample(example: string) {
    setInput(example);
  }

  function handleSubmit() {
    const trimmed = input.trim();
    if (!trimmed) return;
    sessionStorage.setItem("wf_raw_input", trimmed);
    navigate("/workflow/create/processing");
  }

  const charCount = input.trim().length;
  const isReady = charCount >= 10;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ background: "var(--bg)" }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 800,
          height: 400,
          background:
            "radial-gradient(ellipse at top, rgba(139,92,246,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)" }}
            >
              <Sparkles size={18} style={{ color: "var(--accent)" }} />
            </div>
            <span className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
              FlowMind AI
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3" style={{ color: "var(--fg)" }}>
            What do you want to automate?
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "var(--fg-muted)" }}>
            Describe your automation in plain English — no technical knowledge needed.
            <br />
            FlowMind AI will build the workflow for you.
          </p>
        </div>

        {/* Textarea */}
        <div
          style={{
            border: `1.5px solid ${focused ? "var(--accent)" : "var(--border)"}`,
            borderRadius: 16,
            background: "var(--surface)",
            transition: "border-color 0.2s, box-shadow 0.2s",
            boxShadow: focused ? "0 0 0 3px rgba(139,92,246,0.12)" : "none",
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && isReady) {
                handleSubmit();
              }
            }}
            placeholder="e.g. When I receive a customer email, summarize it and post to Slack #support channel..."
            rows={5}
            className="w-full resize-none bg-transparent outline-none text-sm leading-relaxed"
            style={{
              padding: "18px 20px 12px",
              color: "var(--fg)",
              caretColor: "var(--accent)",
            }}
          />

          {/* Footer bar */}
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <span className="text-xs" style={{ color: "var(--fg-subtle)" }}>
              {isReady ? "⌘↵ to generate" : `${10 - charCount} more characters…`}
            </span>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={!isReady}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-opacity"
              style={{
                background: isReady ? "var(--accent)" : "var(--surface2)",
                color: isReady ? "#000" : "var(--fg-subtle)",
                cursor: isReady ? "pointer" : "not-allowed",
                opacity: isReady ? 1 : 0.6,
              }}
            >
              <Sparkles size={14} />
              Generate Workflow
              <ArrowRight size={14} />
            </motion.button>
          </div>
        </div>

        {/* Example prompts */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={13} style={{ color: "var(--fg-muted)" }} />
            <span className="text-xs font-medium" style={{ color: "var(--fg-muted)" }}>
              Try an example
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {EXAMPLES.map((example, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                whileHover={{ scale: 1.01 }}
                onClick={() => handleExample(example)}
                className="text-left text-xs px-4 py-3 rounded-xl transition-colors"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--fg-muted)",
                  lineHeight: "1.5",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(139,92,246,0.4)";
                  (e.currentTarget as HTMLElement).style.color = "var(--fg)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLElement).style.color = "var(--fg-muted)";
                }}
              >
                "{example}"
              </motion.button>
            ))}
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-xs transition-colors"
            style={{ color: "var(--fg-subtle)" }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "var(--fg-muted)")}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "var(--fg-subtle)")}
          >
            ← Back to Dashboard
          </button>
        </div>
      </motion.div>
    </div>
  );
}
