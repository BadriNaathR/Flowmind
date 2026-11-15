import time
from datetime import datetime
from typing import Optional

from app.core.config import settings


class SheetsClient:
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

            # TCS system: disable SSL verification for all Sheets API calls
            _http = httplib2.Http()
            _http.disable_ssl_certificate_validation = True
            _auth_http = google_auth_httplib2.AuthorizedHttp(creds, http=_http)
            return build("sheets", "v4", http=_auth_http, cache_discovery=False)
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
        spreadsheet_id = params.get("spreadsheet_id", "")
        sheet = params.get("sheet", "Sheet1")

        if not spreadsheet_id:
            return self._simulated(action, params)

        if any(w in a for w in ("append", "log", "add", "write", "insert", "record")):
            row_data = params.get("row", [str(v) for v in params.values() if v != spreadsheet_id])
            result = service.spreadsheets().values().append(
                spreadsheetId=spreadsheet_id,
                range=f"{sheet}!A:Z",
                valueInputOption="USER_ENTERED",
                body={"values": [row_data]},
            ).execute()
            updates = result.get("updates", {})
            return {
                "spreadsheet_id": spreadsheet_id,
                "range": updates.get("updatedRange", f"{sheet}!A:Z"),
                "updated_rows": updates.get("updatedRows", 1),
                "updated_cells": updates.get("updatedCells", 1),
            }

        if any(w in a for w in ("read", "get", "fetch", "retrieve")):
            result = service.spreadsheets().values().get(
                spreadsheetId=spreadsheet_id,
                range=f"{sheet}!A1:Z50",
            ).execute()
            rows = result.get("values", [])
            return {"rows": rows, "total": len(rows), "range": result.get("range", "")}

        if "update" in a:
            cell = params.get("cell", "A2")
            row_data = params.get("row", [str(v) for v in params.values()])
            result = service.spreadsheets().values().update(
                spreadsheetId=spreadsheet_id,
                range=f"{sheet}!{cell}",
                valueInputOption="USER_ENTERED",
                body={"values": [row_data]},
            ).execute()
            return {"updated_cells": result.get("updatedCells", 0), "range": result.get("updatedRange", ""), "status": "updated"}

        return {"status": "ok", "action": action, "sheet": sheet}

    def _simulated(self, action: str, params: dict) -> dict:
        time.sleep(0.8)
        a = action.lower()
        sheet = params.get("sheet", "Sheet1")
        if any(w in a for w in ("append", "log", "add", "write", "insert", "record")):
            return {
                "spreadsheet_id": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms",
                "range": f"{sheet}!A:Z",
                "updated_rows": 1,
                "updated_cells": 5,
                "_simulated": True,
            }
        if any(w in a for w in ("read", "get", "fetch", "retrieve")):
            return {
                "rows": [
                    ["John", "Doe", "john@example.com", "Active"],
                    ["Jane", "Smith", "jane@example.com", "Pending"],
                ],
                "total": 2,
                "range": f"{sheet}!A1:D3",
                "_simulated": True,
            }
        if "update" in a:
            return {"updated_cells": 3, "range": f"{sheet}!A2:C2", "status": "updated", "_simulated": True}
        return {"status": "ok", "action": action, "sheet": sheet, "_simulated": True}
