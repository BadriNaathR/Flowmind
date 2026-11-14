import time


class GenericClient:
    """Fallback client for 'http' and 'internal' integrations."""

    def execute(self, action: str, params: dict) -> dict:
        time.sleep(0.4)
        return {"status": "ok", "action": action, "params": params}
