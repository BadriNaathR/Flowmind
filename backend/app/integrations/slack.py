import time
from typing import Optional


class SlackClient:
    def __init__(self, bot_token: Optional[str] = None):
        self.bot_token = bot_token

    def _get_client(self):
        if not self.bot_token:
            return None
        try:
            import ssl
            from slack_sdk import WebClient
            # TCS system: disable SSL certificate verification
            _ssl_ctx = ssl.create_default_context()
            _ssl_ctx.check_hostname = False
            _ssl_ctx.verify_mode = ssl.CERT_NONE
            return WebClient(token=self.bot_token, ssl=_ssl_ctx)
        except Exception:
            return None

    def execute(self, action: str, params: dict) -> dict:
        client = self._get_client()
        if client is None:
            return self._simulated(action, params)
        try:
            return self._real(action, params, client)
        except Exception:
            return self._simulated(action, params)

    def _real(self, action: str, params: dict, client) -> dict:
        a = action.lower()
        channel = params.get("channel", "#general")

        if any(w in a for w in ("send", "post", "notify", "message", "alert", "write")):
            text = params.get("message", params.get("text", "FlowMind notification"))
            resp = client.chat_postMessage(channel=channel, text=text)
            return {
                "ts": resp["ts"],
                "channel": resp["channel"],
                "status": "sent",
                "message": text,
            }

        if any(w in a for w in ("list", "channels", "get", "fetch")):
            resp = client.conversations_list(limit=10)
            channels = [{"id": c["id"], "name": c["name"]} for c in resp.get("channels", [])]
            return {"channels": channels, "total": len(channels)}

        return {"status": "ok", "action": action}

    def _simulated(self, action: str, params: dict) -> dict:
        time.sleep(0.7)
        a = action.lower()
        channel = params.get("channel", "#general")
        if any(w in a for w in ("send", "post", "notify", "message", "alert", "write")):
            return {
                "ts": "1709123456.789012",
                "channel": channel,
                "status": "sent",
                "message": params.get("message", "FlowMind notification"),
                "_simulated": True,
            }
        if any(w in a for w in ("list", "channels", "get", "fetch")):
            return {
                "channels": [
                    {"id": "C1234567890", "name": "general"},
                    {"id": "C0987654321", "name": "alerts"},
                ],
                "total": 2,
                "_simulated": True,
            }
        return {"status": "ok", "action": action, "_simulated": True}
