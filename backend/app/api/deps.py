from typing import Annotated

from core.config import settings
from fastapi import Depends
from sqlmodel.ext.asyncio.session import AsyncSession

from ..dependencies import get_db_session, get_settings

DatabaseDep = Annotated[AsyncSession, Depends(get_db_session)]
SettingsDep = Annotated[type(settings), Depends(get_settings)]
