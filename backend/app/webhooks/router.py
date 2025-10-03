from fastapi import APIRouter

from . import telegram

webhook_router = APIRouter()

webhook_router.include_router(telegram.router)
