"""
Parser Agent — decomposes natural-language automation descriptions into
structured workflow definitions using the OpenAI-compatible API.

Environment routing:
  APP_ENV=local  → TCS GenAI Lab (OpenAI-compatible, SSL disabled)
  anything else  → OpenRouter
"""
import json
import httpx
from openai import OpenAI

from app.core.config import settings

_SYSTEM_PROMPT = """You are FlowMind, an AI workflow automation assistant.
Your job is to decompose a user's natural-language automation request into
a structured workflow definition. Reply ONLY with valid JSON — no markdown, no extra text.

JSON schema:
{
  "name": "Short workflow name (≤60 chars)",
  "confidence": 85,
  "confidence_reason": "One sentence explaining your confidence level — what is clear and what is ambiguous",
  "trigger": {
    "type": "schedule|webhook|manual|email|event",
    "config": {
      "from_email": "sender@example.com or empty string",
      "subject_contains": "keyword or empty string",
      "interval_minutes": 5
    }
  },
  "steps": [
    {
      "step_id": "step_1",
      "type": "action|condition|transform|notify",
      "integration": "gmail|slack|sheets|notion|http|internal",
      "action": "verb describing what happens",
      "params": {}
    }
  ]
}

Rules:
- 2–6 steps maximum.
- Use only these integrations: gmail, slack, sheets, notion, http, internal.
- Keep params simple — string keys and string/number/boolean values only.
- The trigger type must be one of: schedule, webhook, manual, email, event.
- For email triggers: extract from_email and subject_contains from the user description if mentioned. Leave as empty string if not specified.
- For schedule triggers: set interval_minutes (default 60).
- For manual triggers: config can be empty {}.

Integration-specific params:
- notion: always include "parent_id": "4194b6e5-60ab-806d-83dd-e21fea75a29b" (FlowMind Tasks page) in every notion step params.
- slack: always use "channel": "#new-channel" unless the user specifies a different channel.
- gmail: include "to" and "subject" for send actions.
- sheets: include "sheet": "Sheet1" for all sheet actions.
"""


def _get_client() -> tuple[OpenAI, str]:
    """Return (OpenAI client, model name) routed to TCS (local) or OpenRouter (prod)."""
    if settings.APP_ENV == "local":
        return (
            OpenAI(
                api_key=settings.TCS_API_KEY,
                base_url=settings.TCS_BASE_URL,
                http_client=httpx.Client(verify=False),  # TCS SSL bypass
            ),
            settings.TCS_MODEL,
        )
    return (
        OpenAI(
            api_key=settings.OPENROUTER_API_KEY,
            base_url=settings.OPENROUTER_BASE_URL,
            default_headers={
                "HTTP-Referer": "https://flowmind.app",
                "X-Title": "FlowMind",
            },
        ),
        settings.OPENROUTER_MODEL,
    )


def decompose_workflow(raw_input: str) -> dict:
    """
    Call the Parser Agent and return a validated workflow dict.
    Raises ValueError if the LLM response cannot be parsed as JSON.
    """
    client, model = _get_client()

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user",   "content": raw_input},
        ],
        temperature=0.3,
        max_tokens=1024,
    )
    content = (response.choices[0].message.content or "").strip()

    # Strip markdown code fences if the model wrapped the JSON
    if content.startswith("```"):
        lines = content.splitlines()
        content = "\n".join(
            line for line in lines if not line.startswith("```")
        ).strip()

    try:
        data = json.loads(content)
    except json.JSONDecodeError as exc:
        raise ValueError(f"LLM returned non-JSON: {content[:200]}") from exc

    # Ensure every step has a unique step_id
    for i, step in enumerate(data.get("steps", []), start=1):
        if not step.get("step_id"):
            step["step_id"] = f"step_{i}"

    # Clamp confidence to 0-100
    data["confidence"] = max(0, min(100, int(data.get("confidence", 80))))
    data.setdefault("confidence_reason", "")

    return data
