from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg2://flex:flex@localhost:5432/flex2"
    jwt_secret: str = "replace-this-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 480

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()