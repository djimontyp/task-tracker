from typing import Annotated

from core.config import Settings
from fastapi import Depends
from sqlmodel.ext.asyncio.session import AsyncSession

from app.dependencies import get_db_session, get_settings

DatabaseDep = Annotated[AsyncSession, Depends(get_db_session)]
SettingsDep = Annotated[Settings, Depends(get_settings)]
