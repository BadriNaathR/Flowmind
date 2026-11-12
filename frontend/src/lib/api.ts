import axios from "axios";

const api = axios.create({
  baseURL: "/api/v1",
  headers: { "Content-Type": "application/json" },
});

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("fm_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to /login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("fm_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;

// ─── Typed helpers ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
}

export interface Integration {
  provider: "gmail" | "slack" | "sheets" | "notion";
  connected: boolean;
  connected_at?: string;
}

export interface WorkflowStep {
  step_id: string;
  type: string;
  integration: string;
  action: string;
  params: Record<string, unknown>;
}

export interface Workflow {
  id: string;
  name: string;
  status: "draft" | "active" | "paused" | "failed";
  run_count: number;
  last_run_at: string | null;
  created_at: string;
  trigger: Record<string, unknown>;
  steps: WorkflowStep[];
}

export interface WorkflowRun {
  id: string;
  workflow_id: string;
  status: "running" | "success" | "failed" | "partial";
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
}

export interface RunLog {
  id: string;
  step_index: number;
  step_type: string;
  integration: string;
  status: "pending" | "running" | "success" | "failed" | "not_executed";
  started_at: string | null;
  completed_at: string | null;
  output_data: Record<string, unknown> | null;
  error_message: string | null;
  retry_count: number;
}
