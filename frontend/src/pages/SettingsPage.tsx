import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, User, Mail, Shield, LogOut, Trash2,
  CheckCircle, XCircle, Loader2, BookOpen, MessageSquare,
  FileSpreadsheet, Zap,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import api, { type Integration } from "@/lib/api";

// ─── Integration icons ────────────────────────────────────────────────────────

function GmailIcon() {
  return (
    <svg viewBox="0 0 48 48" width="20" height="20">
      <path fill="#4CAF50" d="M45 16.2l-5 2.75-5 4.75V40h7a3 3 0 003-3V16.2z"/>
      <path fill="#1E88E5" d="M3 16.2l3.5 1.75L13 23.7V40H6a3 3 0 01-3-3V16.2z"/>
      <polygon fill="#E53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17"/>
      <path fill="#C62828" d="M3 12.298V16.2l10 7.5V11.2L9.876 8.859A4.198 4.198 0 003 12.298z"/>
      <path fill="#FBC02D" d="M45 12.298V16.2l-10 7.5V11.2l3.124-2.341A4.198 4.198 0 0145 12.298z"/>
    </svg>
  );
}

const INTEGRATION_CONFIG = [
  {
    id: "gmail",
    name: "Gmail",
    description: "Read emails and send automated replies",
    color: "#EA4335",
    Icon: GmailIcon,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Post messages and notifications to channels",
    color: "#E01E5A",
    Icon: () => <MessageSquare size={20} style={{ color: "#E01E5A" }} />,
  },
  {
    id: "sheets",
    name: "Google Sheets",
    description: "Log data and update spreadsheets automatically",
    color: "#34A853",
    Icon: () => <FileSpreadsheet size={20} style={{ color: "#34A853" }} />,
  },
  {
    id: "notion",
    name: "Notion",
    description: "Create pages and manage your workspace",
    color: "#a78bfa",
    Icon: () => <BookOpen size={20} style={{ color: "#a78bfa" }} />,
  },
];

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 20,
      }}
    >
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "var(--fg-subtle)", textTransform: "uppercase" }}>
          {title}
        </p>
      </div>
      {children}
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState<string | null>(null);

  useEffect(() => {
    api.get("/integrations")
      .then((r) => setIntegrations(r.data))
      .catch(() => {});
  }, []);

  function isConnected(provider: string) {
    return integrations.find((i) => i.provider === provider)?.connected ?? false;
  }

  async function handleDisconnect(provider: string) {
    if (confirmDisconnect !== provider) {
      setConfirmDisconnect(provider);
      return;
    }
    setDisconnecting(provider);
    setConfirmDisconnect(null);
    try {
      await api.delete(`/integrations/${provider}`);
      setIntegrations((prev) =>
        prev.map((i) => i.provider === provider ? { ...i, connected: false } : i)
      );
    } catch {
      // already disconnected or error — refresh list
      const r = await api.get("/integrations");
      setIntegrations(r.data);
    } finally {
      setDisconnecting(null);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen px-4 py-14" style={{ background: "var(--bg)" }}>
      {/* Glow */}
      <div style={{
        position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
        width: 600, height: 280,
        background: "radial-gradient(ellipse at top, rgba(139,92,246,0.05) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div className="max-w-xl mx-auto">

        {/* Back */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1.5 text-xs mb-6 transition-colors"
          style={{ color: "var(--fg-muted)" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--fg)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--fg-muted)")}
        >
          <ArrowLeft size={13} /> Dashboard
        </button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} style={{ color: "var(--accent)" }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
              Settings
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--fg)" }}>
            Account & Integrations
          </h1>
        </motion.div>

        {/* Profile */}
        <Section title="Profile">
          <div style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {/* Avatar */}
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                background: "linear-gradient(135deg, #38bdf8, #a78bfa)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                overflow: "hidden",
              }}>
                {user?.avatar_url
                  ? <img src={user.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <User size={20} style={{ color: "#000" }} />
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: "var(--fg)", marginBottom: 2 }}>
                  {user?.name ?? "—"}
                </p>
                <p style={{ fontSize: 12, color: "var(--fg-muted)", display: "flex", alignItems: "center", gap: 5 }}>
                  <Mail size={11} /> {user?.email ?? "—"}
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* Integrations */}
        <Section title="Connected integrations">
          <div>
            {INTEGRATION_CONFIG.map(({ id, name, description, color, Icon }, i) => {
              const connected = isConnected(id);
              const isDisconnecting = disconnecting === id;
              const needsConfirm = confirmDisconnect === id;

              return (
                <div
                  key={id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 20px",
                    borderBottom: i < INTEGRATION_CONFIG.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: color + "15", border: `1px solid ${color}25`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon />
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", marginBottom: 1 }}>{name}</p>
                    <p style={{ fontSize: 11, color: "var(--fg-muted)" }}>{description}</p>
                  </div>

                  {/* Status + action */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    {connected ? (
                      <>
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#22c55e", fontWeight: 600 }}>
                          <CheckCircle size={11} /> Connected
                        </span>
                        <button
                          onClick={() => handleDisconnect(id)}
                          disabled={!!isDisconnecting}
                          style={{
                            fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6,
                            background: needsConfirm ? "#ef444418" : "transparent",
                            color: needsConfirm ? "#ef4444" : "var(--fg-subtle)",
                            border: `1px solid ${needsConfirm ? "#ef444430" : "var(--border)"}`,
                            cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 4,
                          }}
                        >
                          {isDisconnecting
                            ? <Loader2 size={10} className="animate-spin" />
                            : <XCircle size={10} />
                          }
                          {needsConfirm ? "Confirm" : "Disconnect"}
                        </button>
                      </>
                    ) : (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--fg-subtle)", fontWeight: 500 }}>
                        <XCircle size={11} /> Not connected
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Security */}
        <Section title="Security">
          <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
            <Shield size={16} style={{ color: "var(--fg-muted)", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", marginBottom: 1 }}>Password</p>
              <p style={{ fontSize: 11, color: "var(--fg-muted)" }}>
                {user?.avatar_url ? "Signed in with Google — no password set" : "Managed via email & password"}
              </p>
            </div>
          </div>
        </Section>

        {/* Danger zone */}
        <Section title="Session">
          <div style={{ padding: "16px 20px" }}>
            <button
              onClick={handleLogout}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                width: "100%", padding: "11px 16px", borderRadius: 10,
                background: "transparent", border: "1px solid var(--border)",
                color: "var(--fg-muted)", fontSize: 13, fontWeight: 600,
                cursor: "pointer", transition: "all 0.15s", textAlign: "left",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#ef444430";
                (e.currentTarget as HTMLElement).style.color = "#ef4444";
                (e.currentTarget as HTMLElement).style.background = "#ef444408";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLElement).style.color = "var(--fg-muted)";
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <LogOut size={14} />
              Sign out of FlowMind
            </button>
          </div>
        </Section>

      </div>
    </div>
  );
}
