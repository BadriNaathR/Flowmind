import time


class GmailClient:
    def execute(self, action: str, params: dict) -> dict:
        time.sleep(1.1)
        a = action.lower()

        if any(w in a for w in ("read", "fetch", "check", "monitor", "watch", "trigger")):
            return {
                "found": 3,
                "emails": [
                    {
                        "id": "msg_1a2b3c",
                        "from": "client@example.com",
                        "subject": "Re: Proposal Q4",
                        "snippet": "Looks great, let's proceed with the plan...",
                    },
                    {
                        "id": "msg_4d5e6f",
                        "from": "support@vendor.com",
                        "subject": "Invoice #4821",
                        "snippet": "Please find the invoice attached...",
                    },
                ],
            }

        if any(w in a for w in ("send", "compose", "draft")):
            return {
                "message_id": "msg_sent_8f3a4b",
                "status": "sent",
                "to": params.get("to", "recipient@example.com"),
                "subject": params.get("subject", "FlowMind Automation"),
            }

        if "reply" in a:
            return {"message_id": "msg_reply_2b9c1d", "status": "replied", "thread_id": "thread_xyz"}

        if any(w in a for w in ("label", "tag", "mark")):
            return {"label": params.get("label", "processed"), "applied_to": 3, "status": "labelled"}

        if any(w in a for w in ("extract", "parse", "get data")):
            return {
                "order_id": "ORD-2847",
                "amount": "$142.50",
                "customer": "John Doe",
                "date": "2026-11-13",
            }

        return {"status": "ok", "action": action}
