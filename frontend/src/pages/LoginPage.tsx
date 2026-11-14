import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleGoogleLogin() {
    window.location.href = "/api/v1/auth/google";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", { email, password });
      setToken(res.data.access_token);
      setUser(res.data.user);
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg)" }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 500,
          height: 260,
          background:
            "radial-gradient(ellipse at top, rgba(56,189,248,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="surface-card w-full max-w-sm p-8"
      >
        {/* Header */}
        <div className="text-center mb-7">
          <div
            className="text-2xl font-bold mb-1 text-gradient"
            style={{ display: "inline-block" }}
          >
            FlowMind
          </div>
          <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
            Sign in to your account
          </p>
        </div>

        {/* Email / password form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: "var(--fg-muted)" }}
            >
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              style={{
                width: "100%",
                padding: "9px 12px",
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--fg)",
                fontSize: 14,
                outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: "var(--fg-muted)" }}
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: "100%",
                  padding: "9px 36px 9px 12px",
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--fg)",
                  fontSize: 14,
                  outline: "none",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--fg-subtle)", background: "none", border: "none", cursor: "pointer" }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs px-3 py-2 rounded-lg"
              style={{
                color: "var(--danger)",
                background: "rgba(248,113,113,0.08)",
                border: "1px solid rgba(248,113,113,0.2)",
              }}
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          <span className="text-xs" style={{ color: "var(--fg-subtle)" }}>
            or
          </span>
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        </div>

        {/* Google */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl text-sm font-medium transition-all"
          style={{
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            color: "var(--fg)",
            cursor: "pointer",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.borderColor = "var(--fg-subtle)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.borderColor = "var(--border)")
          }
        >
          <GoogleIcon />
          Continue with Google
        </button>

        {/* Register link */}
        <p className="text-center text-xs mt-6" style={{ color: "var(--fg-subtle)" }}>
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-medium transition-colors"
            style={{ color: "var(--accent)" }}
          >
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20H24v8h11.3c-1.6 4.4-5.8 7.6-11.3 7.6C17.9 35.6 12 29.7 12 22.4S17.9 9.2 24 9.2c3 0 5.7 1.1 7.8 2.9l5.6-5.6C34 3.3 29.3 1.2 24 1.2 12.4 1.2 3 10.6 3 22.4s9.4 21.2 21 21.2c10.9 0 20-7.9 20-21.2 0-1.4-.1-2.8-.4-4.4z" />
      <path fill="#FF3D00" d="M6.3 13.9l6.6 4.8c1.8-4.3 6-7.3 11.1-7.3 3 0 5.7 1.1 7.8 2.9l5.6-5.6C34 3.3 29.3 1.2 24 1.2c-7.6 0-14.2 4.3-17.7 10.7z" />
      <path fill="#4CAF50" d="M24 43.6c5.2 0 9.8-1.9 13.4-5l-6.2-5.2c-2 1.4-4.5 2.2-7.2 2.2-5.4 0-9.9-3.6-11.6-8.6L6 31.9C9.5 38.9 16.2 43.6 24 43.6z" />
      <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.2-2.2 4-4.1 5.3l6.2 5.2C40.9 35 44 29.1 44 22.4c0-1.4-.1-2.8-.4-4.4z" />
    </svg>
  );
}
