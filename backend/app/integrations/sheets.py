import time


class SheetsClient:
    def execute(self, action: str, params: dict) -> dict:
        time.sleep(0.8)
        a = action.lower()
        sheet = params.get("sheet", "Sheet1")

        if any(w in a for w in ("append", "log", "add", "write", "insert", "record")):
            return {
                "spreadsheet_id": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms",
                "range": f"{sheet}!A:Z",
                "updated_rows": 1,
                "updated_cells": 5,
            }

        if any(w in a for w in ("read", "get", "fetch", "retrieve")):
            return {
                "rows": [
                    ["John", "Doe", "john@example.com", "Active"],
                    ["Jane", "Smith", "jane@example.com", "Pending"],
                ],
                "total": 2,
                "range": f"{sheet}!A1:D3",
            }

        if "update" in a:
            return {"updated_cells": 3, "range": f"{sheet}!A2:C2", "status": "updated"}

        return {"status": "ok", "action": action, "sheet": sheet}
