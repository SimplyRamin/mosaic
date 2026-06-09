# =================================================================================================
#                                           Written by Ramin F.
#                                      AI Engineer & Data Scientist
#                            Ferdos.ramin@gmail.com | simplyramin.github.io
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
    database_url: str = ""

    # APP
    app_env: str = "development"
    secret_key: str

    model_config = {
        "env_file": Path(__file__).parent.parent / ".env"
    }

settings = Settings()    # type: ignore