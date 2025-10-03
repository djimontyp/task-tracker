from datetime import datetime
from urllib.parse import quote

from fastapi import APIRouter, Request

from ..models import MessageResponse
from ..tasks import save_telegram_message
from ..websocket import manager

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

            if True:
                first_name = from_user.get("first_name", "")
                last_name = from_user.get("last_name", "")
                name = f"{first_name} {last_name}".strip() or "User"
                avatar_url = f"https://ui-avatars.com/api/?name={quote(name)}&background=0D8ABC&color=fff&size=128"
                print(f"🎨 Generated avatar URL from name: {name}")

            live_response = MessageResponse(
                id=0,
                external_message_id=str(message["message_id"]),
                content=message.get("text", message.get("caption", "[Media]")),
                author=from_user.get("first_name", "Unknown"),
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
