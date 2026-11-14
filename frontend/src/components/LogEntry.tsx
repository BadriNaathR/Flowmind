import { motion } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Mail,
  MessageSquare,
  Table,
  FileText,
  Globe,
  Cpu,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import type { RunEvent } from "@/hooks/useRunStream";

function IntegrationIcon({ name }: { name: string }) {
  const cls = "w-3.5 h-3.5";
  switch (name) {
    case "gmail":   return <Mail className={cls} />;
    case "slack":   return <MessageSquare className={cls} />;
    case "sheets":  return <Table className={cls} />;
    case "notion":  return <FileText className={cls} />;
    case "http":    return <Globe className={cls} />;
    default:        return <Cpu className={cls} />;
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

interface LogEntryProps {
  stepEvent: RunEvent;
  completedEvent?: RunEvent;
}

export function LogEntry({ stepEvent, completedEvent }: LogEntryProps) {
  const [expanded, setExpanded] = useState(false);
  const integration = stepEvent.integration ?? "internal";
  const color = INTEGRATION_COLORS[integration] ?? "#888";

  const isCompleted = completedEvent?.type === "step_completed";
  const isFailed = completedEvent?.type === "step_failed";
  const isRunning = !completedEvent;

  const hasOutput = isCompleted && completedEvent?.output && Object.keys(completedEvent.output).length > 0;
  const outputStr = hasOutput ? JSON.stringify(completedEvent!.output, null, 2) : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        border: `1px solid ${
          isCompleted ? `${color}35` : isFailed ? "#ef444435" : "var(--border)"
        }`,
        borderRadius: 12,
        padding: "12px 14px",
        background: isCompleted
          ? `${color}08`
          : isFailed
          ? "#ef444408"
          : "var(--surface)",
        marginBottom: 8,
      }}
    >
      <div className="flex items-center gap-3">
        {/* Status icon */}
        <div
          style={{
            color: isCompleted ? color : isFailed ? "#ef4444" : "var(--fg-muted)",
            flexShrink: 0,
          }}
        >
          {isRunning && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <Loader2 size={17} />
            </motion.div>
          )}
          {isCompleted && <CheckCircle size={17} />}
          {isFailed && <XCircle size={17} />}
        </div>

        {/* Integration badge */}
        <span
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
          style={{ background: `${color}18`, color }}
        >
          <IntegrationIcon name={integration} />
          {integration}
        </span>

        {/* Action label */}
        <span
          className="text-sm flex-1 truncate"
          style={{ color: "var(--fg)" }}
        >
          {stepEvent.action}
        </span>

        {/* Duration */}
        {completedEvent?.duration_ms !== undefined && (
          <span
            className="text-xs flex-shrink-0"
            style={{ color: "var(--fg-muted)" }}
          >
            {completedEvent.duration_ms}ms
          </span>
        )}

        {/* Expand toggle for output */}
        {hasOutput && (
          <button
            onClick={() => setExpanded((x) => !x)}
            style={{ color: "var(--fg-muted)", flexShrink: 0 }}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        )}
      </div>

      {/* Output JSON (expandable) */}
      {hasOutput && expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-2 ml-8 text-xs font-mono overflow-auto"
          style={{
            color: "var(--fg-muted)",
            background: "var(--surface2, #0f1420)",
            borderRadius: 6,
            padding: "8px 10px",
            maxHeight: 160,
            border: "1px solid var(--border)",
          }}
        >
          <pre>{outputStr}</pre>
        </motion.div>
      )}

      {/* Error message */}
      {isFailed && completedEvent?.error && (
        <div
          className="mt-2 ml-8 text-xs"
          style={{ color: "#ef4444" }}
        >
          {completedEvent.error}
        </div>
      )}
    </motion.div>
  );
}
