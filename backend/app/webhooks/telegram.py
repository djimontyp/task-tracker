from datetime import datetime

from fastapi import APIRouter, HTTPException, Request

from app.services.websocket_manager import websocket_manager
from app.tasks import save_telegram_message
from app.webhook_service import telegram_webhook_service

router = APIRouter(prefix="/webhook", tags=["webhooks"])


@router.post("/telegram")
async def telegram_webhook(request: Request) -> dict[str, str]:
    from loguru import logger

    try:
        update_data = await request.json()

        if "message" in update_data:
            message = update_data["message"]

            from_user = message.get("from", {})
            user_id = from_user.get("id")
            avatar_url = None

            logger.info(f"Webhook received: user_id={user_id}, message_id={message.get('message_id')}")

            if user_id:
                try:
                    avatar_url = await telegram_webhook_service.get_user_avatar_url(int(user_id))
                    if avatar_url:
                        logger.debug(f"Fetched avatar URL for user {user_id}")
                except Exception as exc:
                    logger.warning(f"Failed to fetch avatar for user {user_id}: {exc}")
                    avatar_url = None

            first_name = from_user.get("first_name", "")
            last_name = from_user.get("last_name", "")
            telegram_username = from_user.get("username")

            author = f"{first_name} {last_name}".strip() or telegram_username or "Unknown"

            live_message_data = {
                "id": 0,
                "external_message_id": str(message["message_id"]),
                "content": message.get("text", message.get("caption", "[Media]")),
                "author": author,
                "author_name": author,
                "sent_at": datetime.fromtimestamp(message["date"]).isoformat(),
                "source_name": "telegram",
                "avatar_url": avatar_url,
                "persisted": False,
            }

            connection_count = websocket_manager.get_connection_count("messages")
            logger.debug(f"Broadcasting message.new to {connection_count} WebSocket clients")
            await websocket_manager.broadcast("messages", {"type": "message.new", "data": live_message_data})
            logger.info(f"Instant broadcast sent for message {message['message_id']}")

            try:
                await save_telegram_message.kiq(update_data)
                logger.info(f"TaskIQ task queued for message {message['message_id']}")
            except Exception as e:
                logger.error(f"Failed to queue TaskIQ task for message {message['message_id']}: {e}")

        return {"status": "ok"}

    except Exception as e:
        logger.exception(f"Webhook error processing update: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process webhook: {str(e)}")
