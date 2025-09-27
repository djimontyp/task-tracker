from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from .database import get_db_session


# Database dependency
DatabaseDep = Annotated[AsyncSession, Depends(get_db_session)]


# Settings dependency
def get_settings():
    return settings


SettingsDep = Annotated[type(settings), Depends(get_settings)]
