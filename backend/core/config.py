# =================================================================================================
#                                           Written by Ramin F.
#                                      AI Engineer & Data Scientist
#                            Ferdos.ramin@gmail.com | simplyramin.github.io
# =================================================================================================


from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    # Postgres
    database_url: str = ""

    # APP
    app_env:    str = "development"
    secret_key: str
    enable_whisper: bool = False

    model_config = {
        "env_file": Path(__file__).parent.parent / ".env"
    }

settings = Settings()    # type: ignore
