import time
import uuid as _uuid


class NotionClient:
    def execute(self, action: str, params: dict) -> dict:
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
            }

        if "update" in a:
            return {"page_id": str(_uuid.uuid4()), "status": "updated", "title": title}

        if any(w in a for w in ("search", "find", "query")):
            return {
                "results": [
                    {"title": "Task: Review Q4 Proposal", "id": str(_uuid.uuid4())},
                    {"title": "Task: Follow up with client", "id": str(_uuid.uuid4())},
                ],
                "total": 2,
            }

        return {"status": "ok", "action": action}
