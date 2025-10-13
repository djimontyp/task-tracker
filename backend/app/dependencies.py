from typing import Annotated

from core.config import Settings, settings
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from .database import get_db_session

# Database dependency
DatabaseDep = Annotated[AsyncSession, Depends(get_db_session)]


# Settings dependency
def get_settings() -> Settings:
    return settings


SettingsDep = Annotated[Settings, Depends(get_settings)]
