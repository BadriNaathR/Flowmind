from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    APP_ENV: str = "local"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql://flowmind:flowmind_dev@localhost:5432/flowmind_db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT
    JWT_SECRET_KEY: str = "dev-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_DAYS: int = 7

    # Encryption key for OAuth tokens (Fernet)
    ENCRYPTION_KEY: str = ""

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/google/callback"

    # LLM — Local (TCS GenAI Lab)
    TCS_API_KEY: str = ""
    TCS_BASE_URL: str = "https://genailab.tcs.in/v1"
    TCS_MODEL: str = "genailab-maas-sonnet-4.6"

    # LLM — Production (OpenRouter)
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_MODEL: str = "anthropic/claude-3-haiku"

    # Frontend
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
