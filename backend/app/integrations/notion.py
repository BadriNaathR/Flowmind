import time
import uuid as _uuid
from typing import Optional


class NotionClient:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key

    def _get_client(self):
        if not self.api_key:
            return None
        try:
            import httpx
            from notion_client import Client
            # TCS system: disable SSL verification
            _http = httpx.Client(verify=False)
            return Client(auth=self.api_key, client=_http)
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
        title = params.get("title", "New Task")
        parent_id = params.get("parent_id", params.get("database_id", params.get("page_id", "")))

        if not parent_id:
            return self._simulated(action, params)

        if any(w in a for w in ("create", "add", "new", "make")):
            page = client.pages.create(
                parent={"page_id": parent_id},
                properties={"title": {"title": [{"text": {"content": title}}]}},
            )
            return {
                "page_id": page["id"],
                "title": title,
                "url": page.get("url", f"https://notion.so/{page['id'].replace('-', '')}"),
                "status": "created",
            }

        if "update" in a:
            update_id = params.get("page_id", parent_id)
            page = client.pages.update(
                page_id=update_id,
                properties={"title": {"title": [{"text": {"content": title}}]}},
            )
            return {"page_id": page["id"], "status": "updated", "title": title}

        if any(w in a for w in ("search", "find", "query")):
            query = params.get("query", title)
            resp = client.search(query=query, filter={"value": "page", "property": "object"})
            results = []
            for r in resp.get("results", [])[:5]:
                title_prop = r.get("properties", {}).get("title", {}).get("title", [{}])
                text = title_prop[0].get("text", {}).get("content", "") if title_prop else ""
                results.append({"title": text, "id": r["id"]})
            return {"results": results, "total": len(results)}

        return {"status": "ok", "action": action}

    def _simulated(self, action: str, params: dict) -> dict:
        time.sleep(0.9)
        a = action.lower()
        title = params.get("title", "New Task")
        if any(w in a for w in ("create", "add", "new", "make")):
            page_id = str(_uuid.uuid4())
            return {
                "page_id": page_id,
                "title": title,
                "url": f"https://notion.so/{page_id.replace('-', '')}",
                "status": "created",
                "_simulated": True,
            }
        if "update" in a:
            return {"page_id": str(_uuid.uuid4()), "status": "updated", "title": title, "_simulated": True}
        if any(w in a for w in ("search", "find", "query")):
            return {
                "results": [
                    {"title": "Task: Review Q4 Proposal", "id": str(_uuid.uuid4())},
                    {"title": "Task: Follow up with client", "id": str(_uuid.uuid4())},
                ],
                "total": 2,
                "_simulated": True,
            }
        return {"status": "ok", "action": action, "_simulated": True}
