import time


class SlackClient:
    def execute(self, action: str, params: dict) -> dict:
        time.sleep(0.7)
        a = action.lower()
        channel = params.get("channel", "#general")

        if any(w in a for w in ("post", "send", "message", "notify", "alert", "ping")):
            return {
                "ok": True,
                "channel": channel,
                "ts": "1699876543.123456",
                "message": "Message posted successfully",
                "text": params.get("text", "Automation triggered by FlowMind"),
            }

        if any(w in a for w in ("dm", "direct", "private")):
            return {"ok": True, "channel": "D08ABC123XY", "ts": "1699876543.654321", "status": "delivered"}

        return {"ok": True, "action": action, "channel": channel}
