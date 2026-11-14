"""
Parser Agent — decomposes natural-language automation descriptions into
structured workflow definitions using LangChain + ChatOpenAI.

Environment routing:
  APP_ENV=local  → TCS GenAI Lab (OpenAI-compatible endpoint)
  anything else  → OpenRouter
"""
import json
import httpx

from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage

from app.core.config import settings

_SYSTEM_PROMPT = """You are FlowMind, an AI workflow automation assistant.
Your job is to decompose a user's natural-language automation request into
a structured workflow definition. Reply ONLY with valid JSON — no markdown, no extra text.

JSON schema:
{
  "name": "Short workflow name (≤60 chars)",
  "trigger": {
    "type": "schedule|webhook|manual|email|event",
    "config": {}
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
"""


def _get_llm() -> ChatOpenAI:
    """Return a ChatOpenAI instance routed to TCS (local) or OpenRouter (production)."""
    if settings.APP_ENV == "local":
        # TCS corporate endpoint uses an internal CA; disable SSL verification for local only
        return ChatOpenAI(
            model=settings.TCS_MODEL,
            openai_api_key=settings.TCS_API_KEY,
            openai_api_base=settings.TCS_BASE_URL,
            temperature=0.3,
            max_tokens=1024,
            http_client=httpx.Client(verify=False),
        )
    return ChatOpenAI(
        model=settings.OPENROUTER_MODEL,
        openai_api_key=settings.OPENROUTER_API_KEY,
        openai_api_base=settings.OPENROUTER_BASE_URL,
        temperature=0.3,
        max_tokens=1024,
    )


def decompose_workflow(raw_input: str) -> dict:
    """
    Call the Parser Agent and return a validated workflow dict.
    Raises ValueError if the LLM response cannot be parsed as JSON.
    """
    llm = _get_llm()

    messages = [
        SystemMessage(content=_SYSTEM_PROMPT),
        HumanMessage(content=raw_input),
    ]

    response = llm.invoke(messages)
    content = response.content.strip()

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

    return data
