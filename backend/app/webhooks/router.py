from fastapi import APIRouter

from app.webhooks import telegram

webhook_router = APIRouter()

webhook_router.include_router(telegram.router)
