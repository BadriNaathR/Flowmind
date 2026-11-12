import { motion } from "framer-motion";

export default function LoginPage() {
  const handleGoogleLogin = () => {
    // Sprint 1: redirect to backend OAuth endpoint
    window.location.href = "/api/v1/auth/google";
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="surface-card p-10 w-full max-w-sm text-center"
      >
        <div className="text-3xl font-bold mb-1 text-gradient">FlowMind</div>
        <p className="text-sm mb-8" style={{ color: "var(--fg-muted)" }}>Describe it. We automate it.</p>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-medium transition-all"
          style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--fg)" }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3c-1.6 4.4-5.8 7.6-11.3 7.6C17.9 35.6 12 29.7 12 22.4S17.9 9.2 24 9.2c3 0 5.7 1.1 7.8 2.9l5.6-5.6C34 3.3 29.3 1.2 24 1.2 12.4 1.2 3 10.6 3 22.4s9.4 21.2 21 21.2c10.9 0 20-7.9 20-21.2 0-1.4-.1-2.8-.4-4.4z"/>
            <path fill="#FF3D00" d="M6.3 13.9l6.6 4.8c1.8-4.3 6-7.3 11.1-7.3 3 0 5.7 1.1 7.8 2.9l5.6-5.6C34 3.3 29.3 1.2 24 1.2c-7.6 0-14.2 4.3-17.7 10.7z"/>
            <path fill="#4CAF50" d="M24 43.6c5.2 0 9.8-1.9 13.4-5l-6.2-5.2c-2 1.4-4.5 2.2-7.2 2.2-5.4 0-9.9-3.6-11.6-8.6L6 31.9C9.5 38.9 16.2 43.6 24 43.6z"/>
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.2-2.2 4-4.1 5.3l6.2 5.2C40.9 35 44 29.1 44 22.4c0-1.4-.1-2.8-.4-4.4z"/>
          </svg>
          Continue with Google
        </button>

        <p className="text-xs mt-6" style={{ color: "var(--fg-subtle)" }}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}
