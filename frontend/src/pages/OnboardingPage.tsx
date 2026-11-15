import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, Loader2 } from "lucide-react";
import api from "@/lib/api";

// ─── Provider SVG Icons ───────────────────────────────────────────────────────

function GmailIcon() {
  return (
    <svg viewBox="0 0 48 48" width="28" height="28">
      <path fill="#4CAF50" d="M45 16.2l-5 2.75-5 4.75V40h7a3 3 0 003-3V16.2z" />
      <path fill="#1E88E5" d="M3 16.2l3.5 1.75L13 23.7V40H6a3 3 0 01-3-3V16.2z" />
      <polygon fill="#E53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17" />
      <path fill="#C62828" d="M3 12.298V16.2l10 7.5V11.2L9.876 8.859A4.198 4.198 0 003 12.298z" />
      <path fill="#FBC02D" d="M45 12.298V16.2l-10 7.5V11.2l3.124-2.341A4.198 4.198 0 0145 12.298z" />
    </svg>
  );
}

function SlackIcon() {
  return (
    <svg viewBox="0 0 124 124" width="28" height="28">
      <path d="M26.3 78.3c0 7.3-5.9 13.2-13.2 13.2S0 85.6 0 78.3s5.9-13.2 13.2-13.2H26.3v13.2z" fill="#E01E5A" />
      <path d="M32.9 78.3c0-7.3 5.9-13.2 13.2-13.2s13.2 5.9 13.2 13.2v33c0 7.3-5.9 13.2-13.2 13.2S32.9 118.6 32.9 111.3v-33z" fill="#E01E5A" />
      <path d="M46.1 26.3c-7.3 0-13.2-5.9-13.2-13.2S38.8 0 46.1 0s13.2 5.9 13.2 13.2v13.2H46.1z" fill="#36C5F0" />
      <path d="M46.1 32.9c7.3 0 13.2 5.9 13.2 13.2s-5.9 13.2-13.2 13.2H13.1C5.8 59.3 0 53.4 0 46.1s5.9-13.2 13.2-13.2h33z" fill="#36C5F0" />
      <path d="M97.7 46.1c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2s-5.9 13.2-13.2 13.2H97.7V46.1z" fill="#2EB67D" />
      <path d="M91.1 46.1c0 7.3-5.9 13.2-13.2 13.2s-13.2-5.9-13.2-13.2V13.1C64.7 5.8 70.6 0 77.9 0s13.2 5.9 13.2 13.2v33z" fill="#2EB67D" />
      <path d="M77.9 97.7c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2s-13.2-5.9-13.2-13.2V97.7h13.2z" fill="#ECB22E" />
      <path d="M77.9 91.1c-7.3 0-13.2-5.9-13.2-13.2s5.9-13.2 13.2-13.2h32.9c7.3 0 13.2 5.9 13.2 13.2s-5.9 13.2-13.2 13.2H77.9z" fill="#ECB22E" />
    </svg>
  );
}

function SheetsIcon() {
  return (
    <svg viewBox="0 0 48 48" width="28" height="28">
      <path fill="#43A047" d="M37 45H11a3 3 0 01-3-3V6a3 3 0 013-3h19l10 10v29a3 3 0 01-3 3z" />
      <path fill="#C8E6C9" d="M40 13H30V3z" />
      <path fill="#fff" d="M31 23H17v2h14v-2zm0 4H17v2h14v-2zm0 4H17v2h14v-2z" />
      <path fill="#2E7D32" d="M30 3l10 10H30z" />
    </svg>
  );
}

function NotionIcon() {
  return (
    <svg viewBox="0 0 100 100" width="28" height="28">
      <rect width="100" height="100" rx="16" fill="#fff" />
      <path
        d="M24 20c-4 0-6 2-6 5v55c0 3 2 5 6 5h52c4 0 6-2 6-5V25l-18-5H24z"
        fill="#fff"
        stroke="#e0e0e0"
        strokeWidth="3"
      />
      <path d="M34 38h32M34 50h32M34 62h20" stroke="#333" strokeWidth="4" strokeLinecap="round" />
      <path d="M62 20v18h18" fill="#f0f0f0" stroke="#e0e0e0" strokeWidth="2" />
    </svg>
  );
}

// ─── Integration config ───────────────────────────────────────────────────────

interface IntegrationConfig {
  id: string;
  name: string;
  description: string;
  accentColor: string;
  Icon: () => JSX.Element;
}

const INTEGRATIONS: IntegrationConfig[] = [
  {
    id: "gmail",
    name: "Gmail",
    description: "Trigger workflows from emails and send automated replies",
    accentColor: "#EA4335",
    Icon: GmailIcon,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Post notifications and messages to your channels",
    accentColor: "#E01E5A",
    Icon: SlackIcon,
  },
  {
    id: "sheets",
    name: "Google Sheets",
    description: "Log data, update records, and track metrics automatically",
    accentColor: "#34A853",
    Icon: SheetsIcon,
  },
  {
    id: "notion",
    name: "Notion",
    description: "Create pages, update databases, and manage your tasks",
    accentColor: "#9b8afb",
    Icon: NotionIcon,
  },
];

// ─── Integration card ─────────────────────────────────────────────────────────

function IntegrationCard({
  config,
  isConnected,
  isConnecting,
  onConnect,
}: {
  config: IntegrationConfig;
  isConnected: boolean;
  isConnecting: boolean;
  onConnect: () => void;
}) {
  const { name, description, accentColor, Icon } = config;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: "var(--surface)",
        border: `1px solid ${isConnected ? accentColor + "55" : "var(--border)"}`,
        borderRadius: 12,
        boxShadow: isConnected ? `0 0 20px ${accentColor}20` : "none",
        transition: "border-color 0.3s, box-shadow 0.3s",
      }}
      className="p-4 flex items-center gap-4"
    >
      {/* Icon bubble */}
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-xl"
        style={{
          width: 52,
          height: 52,
          background: "var(--surface2)",
          border: "1px solid var(--border)",
        }}
      >
        <Icon />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm" style={{ color: "var(--fg)" }}>
          {name}
        </div>
        <div className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--fg-muted)" }}>
          {description}
        </div>
      </div>

      {/* Button */}
      <div className="flex-shrink-0">
        <AnimatePresence mode="wait">
          {isConnected ? (
            <motion.div
              key="connected"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{
                background: `${accentColor}20`,
                color: accentColor,
                border: `1px solid ${accentColor}40`,
              }}
            >
              <Check size={12} strokeWidth={3} />
              Connected
            </motion.div>
          ) : (
            <motion.button
              key="connect"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={onConnect}
              disabled={isConnecting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity"
              style={{
                background: "var(--surface2)",
                color: "var(--fg)",
                border: "1px solid var(--border)",
                cursor: isConnecting ? "not-allowed" : "pointer",
                opacity: isConnecting ? 0.6 : 1,
              }}
            >
              {isConnecting ? (
                <Loader2 size={12} className="animate-spin" />
              ) : null}
              {isConnecting ? "Connecting…" : "Connect"}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connected, setConnected] = useState<Set<string>>(new Set());

  // Load real connection status from API on mount
  useEffect(() => {
    api.get("/integrations")
      .then((res) => {
        const set = new Set<string>();
        (res.data as { provider: string; connected: boolean }[]).forEach((i) => {
          if (i.connected) set.add(i.provider);
        });
        setConnected(set);
      })
      .catch(() => {});
  }, []);

  // After returning from OAuth, re-fetch status
  useEffect(() => {
    const param = searchParams.get("connected");
    if (!param) return;
    api.get("/integrations")
      .then((res) => {
        const set = new Set<string>();
        (res.data as { provider: string; connected: boolean }[]).forEach((i) => {
          if (i.connected) set.add(i.provider);
        });
        setConnected(set);
      })
      .catch(() => {});
  }, [searchParams]);

  async function handleConnect(provider: string) {
    if (connected.has(provider) || connecting) return;

    const token = localStorage.getItem("fm_token") || "";

    // Gmail + Sheets share the same Google OAuth token
    if (provider === "gmail" || provider === "sheets") {
      window.location.href = `/api/v1/integrations/google/connect?token=${encodeURIComponent(token)}`;
      return;
    }

    if (provider === "slack") {
      setConnecting(provider);
      try {
        await api.post(`/integrations/${provider}/connect`, { mock: false });
        setConnected((prev) => new Set([...prev, provider]));
      } catch {
        setConnected((prev) => new Set([...prev, provider]));
      } finally {
        setConnecting(null);
      }
      return;
    }

    // Notion: POST to backend (uses global API key from env)
    setConnecting(provider);
    try {
      await api.post(`/integrations/${provider}/connect`, { mock: false });
      setConnected((prev) => new Set([...prev, provider]));
    } catch {
      // If backend has NOTION_API_KEY set, this will use it; otherwise mock
      setConnected((prev) => new Set([...prev, provider]));
    } finally {
      setConnecting(null);
    }
  }

  const connectedCount = connected.size;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ background: "var(--bg)" }}
    >
      {/* Radial glow */}
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

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-lg"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-sm font-semibold mb-6" style={{ color: "var(--accent)" }}>
            FlowMind
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-3" style={{ color: "var(--fg)" }}>
            Connect your tools
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "var(--fg-muted)" }}>
            FlowMind needs access to your apps to build and run workflows.
            <br />
            Connect at least one to get started.
          </p>
        </div>

        {/* Integration cards */}
        <div className="space-y-3 mb-8">
          {INTEGRATIONS.map((config, i) => (
            <motion.div
              key={config.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i, duration: 0.35 }}
            >
              <IntegrationCard
                config={config}
                isConnected={connected.has(config.id)}
                isConnecting={connecting === config.id}
                onConnect={() => handleConnect(config.id)}
              />
            </motion.div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="space-y-3">
          <AnimatePresence>
            {connectedCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
              >
                <button
                  onClick={() => navigate("/dashboard")}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
                  style={{ background: "var(--accent)", color: "#000" }}
                >
                  Continue to Dashboard
                  <ArrowRight size={15} strokeWidth={2.5} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="text-center">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-xs transition-colors"
              style={{ color: "var(--fg-subtle)" }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "var(--fg-muted)")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "var(--fg-subtle)")}
            >
              {connectedCount === 0 ? "Skip for now →" : `${connectedCount}/4 connected · Add more later`}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
