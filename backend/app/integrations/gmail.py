import time
from datetime import datetime
from typing import Optional

from app.core.config import settings


class GmailClient:
    def __init__(
        self,
        access_token: Optional[str] = None,
        refresh_token: Optional[str] = None,
        expires_at: Optional[datetime] = None,
    ):
        self.access_token = access_token
        self.refresh_token = refresh_token
        self.expires_at = expires_at

    def _get_service(self):
        if not self.access_token:
            return None
        if not (settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET):
            return None
        try:
            import httplib2
            import requests as _req_lib
            import google_auth_httplib2
            from google.auth.transport.requests import Request
            from google.oauth2.credentials import Credentials
            from googleapiclient.discovery import build

            expiry = None
            if self.expires_at:
                expiry = self.expires_at.replace(tzinfo=None) if self.expires_at.tzinfo else self.expires_at

            creds = Credentials(
                token=self.access_token,
                refresh_token=self.refresh_token,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=settings.GOOGLE_CLIENT_ID,
                client_secret=settings.GOOGLE_CLIENT_SECRET,
                expiry=expiry,
            )
            if not creds.valid:
                if creds.expired and creds.refresh_token:
                    # TCS system: disable SSL verification for token refresh
                    _session = _req_lib.Session()
                    _session.verify = False
                    creds.refresh(Request(session=_session))
                else:
                    return None

            # TCS system: disable SSL verification for all Gmail API calls
            _http = httplib2.Http()
            _http.disable_ssl_certificate_validation = True
            _auth_http = google_auth_httplib2.AuthorizedHttp(creds, http=_http)
            return build("gmail", "v1", http=_auth_http, cache_discovery=False)
        except Exception:
            return None

    def execute(self, action: str, params: dict) -> dict:
        service = self._get_service()
        if service is None:
            return self._simulated(action, params)
        try:
            return self._real(action, params, service)
        except Exception:
            return self._simulated(action, params)

    def _real(self, action: str, params: dict, service) -> dict:
        a = action.lower()

        if any(w in a for w in ("read", "fetch", "check", "monitor", "watch", "trigger", "receive")):
            result = service.users().messages().list(userId="me", q="is:unread", maxResults=5).execute()
            messages = result.get("messages", [])
            emails = []
            for msg in messages[:3]:
                detail = service.users().messages().get(
                    userId="me", id=msg["id"], format="metadata",
                    metadataHeaders=["From", "Subject"],
                ).execute()
                headers = {h["name"]: h["value"] for h in detail.get("payload", {}).get("headers", [])}
                emails.append({
                    "id": msg["id"],
                    "from": headers.get("From", ""),
                    "subject": headers.get("Subject", ""),
                    "snippet": detail.get("snippet", ""),
                })
            return {"found": len(messages), "emails": emails}

        if any(w in a for w in ("send", "compose", "draft", "reply")):
            import base64
            from email.mime.text import MIMEText
            msg = MIMEText(params.get("body", "Sent by FlowMind"))
            msg["to"] = params.get("to", "")
            msg["subject"] = params.get("subject", "FlowMind Automation")
            raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
            result = service.users().messages().send(userId="me", body={"raw": raw}).execute()
            return {"message_id": result["id"], "status": "sent", "to": params.get("to", "")}

        if any(w in a for w in ("label", "tag", "mark")):
            label_name = params.get("label", "processed")
            msg_id = params.get("message_id", "")
            if msg_id:
                labels = service.users().labels().list(userId="me").execute()
                label_id = next(
                    (l["id"] for l in labels.get("labels", []) if l["name"].lower() == label_name.lower()),
                    None,
                )
                if not label_id:
                    new_lbl = service.users().labels().create(
                        userId="me",
                        body={"name": label_name, "labelListVisibility": "labelShow", "messageListVisibility": "show"},
                    ).execute()
                    label_id = new_lbl["id"]
                service.users().messages().modify(
                    userId="me", id=msg_id, body={"addLabelIds": [label_id]}
                ).execute()
            return {"label": label_name, "applied_to": 1, "status": "labelled"}

        return {"status": "ok", "action": action}

    def _simulated(self, action: str, params: dict) -> dict:
        time.sleep(1.1)
        a = action.lower()
        if any(w in a for w in ("read", "fetch", "check", "monitor", "watch", "trigger", "receive")):
            return {
                "found": 3,
                "emails": [
                    {"id": "msg_1a2b3c", "from": "client@example.com", "subject": "Re: Proposal Q4", "snippet": "Looks great, let's proceed..."},
                    {"id": "msg_4d5e6f", "from": "support@vendor.com", "subject": "Invoice #4821", "snippet": "Please find attached..."},
                ],
                "_simulated": True,
            }
        if any(w in a for w in ("send", "compose", "draft", "reply")):
            return {"message_id": "msg_sent_8f3a4b", "status": "sent", "to": params.get("to", "recipient@example.com"), "_simulated": True}
        if any(w in a for w in ("label", "tag", "mark")):
            return {"label": params.get("label", "processed"), "applied_to": 3, "status": "labelled", "_simulated": True}
        return {"status": "ok", "action": action, "_simulated": True}
