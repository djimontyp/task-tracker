from datetime import datetime

from fastapi import APIRouter, Request

from ..api.v1.response_models import MessageResponse
from ..tasks import save_telegram_message
from ..websocket import manager
from ..webhook_service import telegram_webhook_service

router = APIRouter(prefix="/webhook", tags=["webhooks"])


@router.post("/telegram")
async def telegram_webhook(request: Request):
    try:
        update_data = await request.json()

        if "message" in update_data:
            message = update_data["message"]

            from_user = message.get("from", {})
            user_id = from_user.get("id")
            avatar_url = None

            print(
                f"🔍 Webhook received: user_id={user_id}, author={from_user.get('first_name')}"
            )

            # Fetch real Telegram avatar if user_id available
            if user_id:
                try:
                    avatar_url = await telegram_webhook_service.get_user_avatar_url(int(user_id))
                    if avatar_url:
                        print(f"✅ Fetched avatar URL for user {user_id}")
                except Exception as exc:
                    print(f"⚠️ Failed to fetch avatar for user {user_id}: {exc}")
                    avatar_url = None

            # Extract user data for display
            first_name = from_user.get("first_name", "")
            last_name = from_user.get("last_name", "")
            telegram_username = from_user.get("username")

            # Display name: "FirstName LastName" or fallback to username
            author = f"{first_name} {last_name}".strip() or telegram_username or "Unknown"

            live_response = MessageResponse(
                id=0,
                external_message_id=str(message["message_id"]),
                content=message.get("text", message.get("caption", "[Media]")),
                author=author,
                sent_at=datetime.fromtimestamp(message["date"]),
                source_name="telegram",
                avatar_url=avatar_url,
                persisted=False,
            )

            message_data = live_response.model_dump()
            message_data["sent_at"] = message_data["sent_at"].isoformat()
            await manager.broadcast({"type": "message.new", "data": message_data})

            try:
                await save_telegram_message.kiq(update_data)
                print(
                    f"✅ TaskIQ завдання відправлено для повідомлення {message['message_id']}"
                )
            except Exception as e:
                print(f"❌ TaskIQ помилка: {e}")

            print(f"⚡ Instant Telegram message broadcast: {message['message_id']}")

        return {"status": "ok"}

    except Exception as e:
        print(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}
