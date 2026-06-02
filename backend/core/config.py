# =================================================================================================
#                                           Written by Ramin F.
#                                   for Tabiat Makan Industrial Group
# =================================================================================================


from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    as_server: str
    as_database: str
    app_env: str = "development"

    model_config = {
        "env_file": Path(__file__).parent.parent / ".env"
    }

settings = Settings()