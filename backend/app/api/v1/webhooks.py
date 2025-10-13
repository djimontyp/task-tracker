import logging

from fastapi import APIRouter, HTTPException

from ...schemas import (
    AddTelegramGroupRequest,
    SetWebhookRequest,
    SetWebhookResponse,
    TelegramWebhookConfig,
    UpdateTelegramGroupIdsRequest,
    WebhookConfigResponse,
)
from ...webhook_service import telegram_webhook_service, webhook_settings_service
from ..deps import DatabaseDep

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhook-settings", tags=["webhook-settings"])


@router.get(
    "",
    response_model=WebhookConfigResponse,
    summary="Get webhook settings",
    response_description="Current webhook configuration and defaults",
)
async def get_webhook_settings(db: DatabaseDep) -> WebhookConfigResponse:
    """
    Get current webhook configuration.

    Returns Telegram webhook config along with default protocol and host values.
    """
    from core.config import settings

    telegram_config = await webhook_settings_service.get_telegram_config(db)

    api_base_url = settings.api_base_url
    default_protocol = "https" if api_base_url.startswith("https") else "http"
    default_host = api_base_url.replace("http://", "").replace("https://", "").split(":")[0]

    return WebhookConfigResponse(
        telegram=telegram_config,
        default_protocol=default_protocol,
        default_host=default_host,
    )


@router.post(
    "",
    response_model=TelegramWebhookConfig,
    summary="Save webhook settings",
    response_description="Saved webhook configuration",
    responses={400: {"description": "Invalid host format"}},
)
async def save_webhook_settings(request: SetWebhookRequest, db: DatabaseDep) -> TelegramWebhookConfig:
    """
    Save webhook configuration without activating it.

    Validates and stores webhook protocol and host settings.
    Does not set the webhook in Telegram until explicitly activated.
    """
    host = request.host.strip()
    if not host:
        raise HTTPException(status_code=400, detail="Host must not be empty")
    if "://" in host:
        raise HTTPException(
            status_code=400,
            detail="Host should not include protocol. Provide only host name or host:port.",
        )

    try:
        return await webhook_settings_service.save_telegram_config(
            db=db,
            protocol=request.protocol,
            host=host,
            is_active=False,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save webhook settings: {str(e)}")


@router.post(
    "/telegram/set",
    response_model=SetWebhookResponse,
    summary="Set Telegram webhook",
    response_description="Webhook activation result",
    responses={400: {"description": "Invalid host format"}},
)
async def set_telegram_webhook(request: SetWebhookRequest, db: DatabaseDep) -> SetWebhookResponse:
    """
    Set Telegram webhook URL via Bot API.

    Validates settings, constructs webhook URL, and activates it in Telegram.
    Saves configuration with active status on success.
    """
    host = request.host.strip()
    if not host:
        raise HTTPException(status_code=400, detail="Host must not be empty")
    if "://" in host:
        raise HTTPException(
            status_code=400,
            detail="Host should not include protocol. Provide only host name or host:port.",
        )

    webhook_url = f"{request.protocol}://{host}/webhook/telegram"

    try:
        result = await telegram_webhook_service.set_webhook(webhook_url)

        if result["success"]:
            await webhook_settings_service.save_telegram_config(
                db=db, protocol=request.protocol, host=host, is_active=True
            )

            return SetWebhookResponse(
                success=True,
                webhook_url=webhook_url,
                message="Webhook set successfully",
            )
        else:
            return SetWebhookResponse(
                success=False,
                webhook_url=webhook_url,
                message="Failed to set webhook",
                error=result.get("error", "Unknown error"),
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to set webhook: {str(e)}")


@router.delete("/telegram", response_model=SetWebhookResponse)
async def delete_telegram_webhook(db: DatabaseDep) -> SetWebhookResponse:
    try:
        result = await telegram_webhook_service.delete_webhook()

        if result["success"]:
            config = await webhook_settings_service.set_telegram_webhook_active(db, False)

            return SetWebhookResponse(
                success=True,
                webhook_url=config.webhook_url if config else None,
                message="Webhook deleted successfully",
            )
        else:
            return SetWebhookResponse(
                success=False,
                webhook_url=None,
                message="Failed to delete webhook",
                error=result.get("error", "Unknown error"),
            )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete webhook: {str(e)}",
        )


@router.get(
    "/telegram/info",
    summary="Get Telegram webhook info",
    response_description="Current webhook information from Telegram API",
)
async def get_telegram_webhook_info() -> dict[str, bool | dict[str, str] | str]:
    """
    Get current webhook information from Telegram Bot API.

    Queries Telegram API for webhook status, URL, certificate info,
    and pending updates count.
    """
    try:
        result = await telegram_webhook_service.get_webhook_info()

        if result["success"]:
            return {"success": True, "webhook_info": result["data"]}
        else:
            return {"success": False, "error": result.get("error", "Unknown error")}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get webhook info: {str(e)}")


@router.put("/telegram/group-ids", response_model=TelegramWebhookConfig)
async def update_telegram_group_ids(request: UpdateTelegramGroupIdsRequest, db: DatabaseDep) -> TelegramWebhookConfig:
    try:
        groups = [{"id": gid, "name": None} for gid in request.group_ids]

        config = await webhook_settings_service.get_telegram_config(db)
        if config:
            for gid in request.group_ids:
                group_info = {"id": gid, "name": None}
                await webhook_settings_service.add_telegram_group(db, group_info)

            updated_config = await webhook_settings_service.get_telegram_config(db)
            if updated_config:
                return updated_config

        raise HTTPException(status_code=404, detail="Webhook settings not found")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update group IDs: {str(e)}")


@router.post("/telegram/groups", response_model=TelegramWebhookConfig)
async def add_telegram_group(request: AddTelegramGroupRequest, db: DatabaseDep) -> TelegramWebhookConfig:
    try:
        chat_info = await telegram_webhook_service.get_chat_info(request.group_id)

        if chat_info["success"]:
            group_info = {
                "id": chat_info["data"]["id"],
                "name": chat_info["data"]["name"],
            }
        else:
            logger.warning(f"Failed to fetch chat info for {request.group_id}: {chat_info.get('error')}")
            group_info = {
                "id": request.group_id,
                "name": None,
            }

        config = await webhook_settings_service.add_telegram_group(db, group_info)

        if config:
            return config
        else:
            raise HTTPException(status_code=500, detail="Failed to add group")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add group: {str(e)}")


@router.delete("/telegram/groups/{group_id}", response_model=TelegramWebhookConfig)
async def remove_telegram_group(group_id: int, db: DatabaseDep) -> TelegramWebhookConfig:
    try:
        config = await webhook_settings_service.remove_telegram_group(db, group_id)

        if config:
            return config
        else:
            raise HTTPException(status_code=404, detail="Webhook settings not found")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove group: {str(e)}")


@router.post("/telegram/groups/refresh-names", response_model=TelegramWebhookConfig)
async def refresh_telegram_group_names(db: DatabaseDep) -> TelegramWebhookConfig:
    try:
        config = await webhook_settings_service.update_group_names(db, telegram_webhook_service)

        if config:
            return config
        else:
            raise HTTPException(status_code=404, detail="Webhook settings not found")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to refresh group names: {str(e)}")
