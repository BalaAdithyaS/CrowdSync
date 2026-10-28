from pydantic_settings import BaseSettings
from typing import List, Union
from pydantic import field_validator
import os
import email_validator

# Disable DNS deliverability checks so test and local domains validate instantaneously without network DNS timeouts
email_validator.TEST_ENVIRONMENT = True
email_validator.CHECK_DELIVERABILITY = False

class Settings(BaseSettings):
    PROJECT_NAME: str = "CrowdSync"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Defaults to SQLite with aiosqlite for zero-config local run, supports postgresql+asyncpg://
    DATABASE_URL: str = "sqlite:///./crowdsync.db"
    
    SECRET_KEY: str = "crowdsync-super-secret-jwt-key-for-dev-change-in-prod-xyz789"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    
    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000"
    ]
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            v_str = v.strip()
            if v_str.startswith("["):
                import json
                try:
                    return json.loads(v_str)
                except Exception:
                    pass
            return [i.strip() for i in v_str.split(",") if i.strip()]
        elif isinstance(v, (list, tuple)):
            return list(v)
        return v
        
    DEMO_MODE: bool = True
    REDIS_URL: str | None = None

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
