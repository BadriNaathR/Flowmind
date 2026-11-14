import { useEffect, useState } from "react";

export type RunEventType =
  | "run_started"
  | "step_started"
  | "step_completed"
  | "step_failed"
  | "run_completed"
  | "error";

export interface RunEvent {
  type: RunEventType;
  // run_started
  run_id?: string;
  workflow_name?: string;
  total_steps?: number;
  // step events
  step_index?: number;
  step_id?: string;
  integration?: string;
  action?: string;
  output?: Record<string, unknown>;
  error?: string;
  duration_ms?: number;
  // run_completed
  status?: "success" | "failed";
  // error
  message?: string;
}

export type StreamStatus = "idle" | "connecting" | "running" | "completed" | "failed";

export function useRunStream(runId: string | null) {
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>("idle");

  useEffect(() => {
    if (!runId) return;

    const token = localStorage.getItem("token") ?? "";
    setStreamStatus("connecting");
    setEvents([]);

    const es = new EventSource(
      `/api/v1/stream/${runId}?token=${encodeURIComponent(token)}`
    );

    es.onopen = () => setStreamStatus("running");

    es.onmessage = (e: MessageEvent) => {
      const event: RunEvent = JSON.parse(e.data as string);
      setEvents((prev) => [...prev, event]);

      if (event.type === "run_started") setStreamStatus("running");
      if (event.type === "run_completed") {
        setStreamStatus(event.status === "success" ? "completed" : "failed");
        es.close();
      }
      if (event.type === "error") {
        setStreamStatus("failed");
        es.close();
      }
    };

    es.onerror = () => {
      setStreamStatus("failed");
      es.close();
    };

    return () => es.close();
  }, [runId]);

  return { events, streamStatus };
}
