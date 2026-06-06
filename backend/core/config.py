# =================================================================================================
#                                           Written by Ramin F.
#                                   for Tabiat Makan Industrial Group
# =================================================================================================


from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    # Analysis Services
    as_server: str
    as_database: str

    # SQL Server
    sql_server: str
    sql_database: str
    sql_username: str
    sql_password: str
    sql_schema: str = "MakanPlus"

    # APP
    app_env: str = "development"
    secret_key: str

    model_config = {
        "env_file": Path(__file__).parent.parent / ".env"
    }

settings = Settings()    # type: ignore