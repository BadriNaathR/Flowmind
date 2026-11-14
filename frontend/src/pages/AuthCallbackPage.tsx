import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      navigate("/login");
      return;
    }

    setToken(token);

    const isNew = params.get("onboard") !== "0";

    api
      .get("/auth/me")
      .then((res) => {
        setUser(res.data);
        navigate(isNew ? "/onboarding" : "/dashboard");
      })
      .catch(() => navigate("/login"));
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--bg)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center space-y-4"
      >
        <div
          className="inline-block w-10 h-10 border-2 rounded-full animate-spin"
          style={{
            borderColor: "var(--border)",
            borderTopColor: "var(--accent)",
          }}
        />
        <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
          Signing you in…
        </p>
      </motion.div>
    </div>
  );
}
