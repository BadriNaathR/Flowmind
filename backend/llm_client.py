"""
Single-file LLM client. Switch providers by changing APP_ENV in .env.
  APP_ENV=local       → TCS GenAI Lab (internal, free, SSL disabled)
  APP_ENV=production  → OpenRouter (zero-cost free tier models)

Usage:
    from llm_client import get_llm
    llm = get_llm()
    response = llm.invoke("Hello")
"""

import warnings

import httpx
from langchain_openai import ChatOpenAI

from app.core.config import settings


def get_llm() -> ChatOpenAI:
    if settings.APP_ENV == "local":
        # TCS GenAI Lab uses an internal SSL certificate — disable verification.
        warnings.filterwarnings("ignore", message=".*Unverified HTTPS.*")
        return ChatOpenAI(
            base_url=settings.TCS_BASE_URL,
            api_key=settings.TCS_API_KEY,
            model=settings.TCS_MODEL,
            http_client=httpx.Client(verify=False),
            streaming=True,
        )

    # production — OpenRouter
    return ChatOpenAI(
        base_url=settings.OPENROUTER_BASE_URL,
        api_key=settings.OPENROUTER_API_KEY,
        model=settings.OPENROUTER_MODEL,
        streaming=True,
        default_headers={"HTTP-Referer": "https://flowmind.app", "X-Title": "FlowMind"},
    )
