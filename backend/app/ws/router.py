import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from loguru import logger

from app.services.message_buffer import message_buffer
from app.services.websocket_manager import websocket_manager

router = APIRouter(tags=["websocket"])


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    topics: str | None = None,
    lastSeq: str | None = None,
) -> None:
    """WebSocket endpoint with topic-based subscriptions and reconnection support.

    Query params:
        topics: Comma-separated list of topics to subscribe to
                (agents, tasks, providers, messages, analysis, proposals, monitoring, metrics)
                If not specified, subscribes to all topics
        lastSeq: Last sequence number received per topic (format: "topic1:seq1,topic2:seq2")
                 Used for replaying missed messages on reconnection

    Message format (client to server):
        {"action": "subscribe", "topic": "agents"}
        {"action": "unsubscribe", "topic": "tasks"}
        {"action": "pong"}  - Response to server ping

    Message format (server to client):
        {"type": "ping", "ts": 1234567890}  - Heartbeat ping
        {"type": "connection", "data": {...}}  - Connection confirmation
        {"topic": "agents", "event": "created", "data": {...}, "_seq": 123}  - Events with sequence
    """
    # Parse topics from query param
    topic_list: list[str]
    if topics:
        topic_list = [t.strip() for t in topics.split(",")]
    else:
        # Default to all topics
        topic_list = ["agents", "tasks", "providers", "messages", "analysis", "proposals", "monitoring", "metrics"]

    # Parse lastSeq for replay (format: "topic1:seq1,topic2:seq2")
    last_sequences: dict[str, int] = {}
    if lastSeq:
        try:
            for pair in lastSeq.split(","):
                if ":" in pair:
                    topic_name, seq_str = pair.split(":", 1)
                    last_sequences[topic_name.strip()] = int(seq_str.strip())
        except ValueError:
            logger.warning(f"Invalid lastSeq format: {lastSeq}")

    # Connect with topic-based manager (returns connection ID)
    conn_id = await websocket_manager.connect(websocket, topic_list, accept=True)

    try:
        # Send connection confirmation with connection ID
        await websocket.send_text(
            json.dumps({
                "type": "connection",
                "data": {
                    "status": "connected",
                    "connectionId": conn_id,
                    "message": "Ready for real-time updates",
                    "topics": topic_list,
                },
            })
        )

        # Replay missed messages for each topic if lastSeq provided
        if last_sequences:
            await _replay_missed_messages(websocket, topic_list, last_sequences)

        # Listen for client messages
        while True:
            data = await websocket.receive_text()

            try:
                message = json.loads(data)
                action = message.get("action") or message.get("type")
                topic = message.get("topic")

                if action == "pong":
                    # Client responding to heartbeat ping
                    await websocket_manager.handle_pong(conn_id)
                elif action == "subscribe" and topic:
                    success = await websocket_manager.subscribe(conn_id, topic)
                    await websocket.send_text(
                        json.dumps({
                            "type": "subscription",
                            "data": {
                                "action": "subscribed" if success else "failed",
                                "topic": topic,
                            },
                        })
                    )
                elif action == "unsubscribe" and topic:
                    success = await websocket_manager.unsubscribe(conn_id, topic)
                    await websocket.send_text(
                        json.dumps({
                            "type": "subscription",
                            "data": {
                                "action": "unsubscribed" if success else "failed",
                                "topic": topic,
                            },
                        })
                    )
            except json.JSONDecodeError:
                # Ignore invalid JSON messages
                pass

    except WebSocketDisconnect:
        await websocket_manager.disconnect(conn_id=conn_id)


async def _replay_missed_messages(
    websocket: WebSocket,
    topics: list[str],
    last_sequences: dict[str, int],
) -> None:
    """Replay missed messages to client after reconnection.

    Args:
        websocket: WebSocket connection
        topics: Topics the client is subscribed to
        last_sequences: Last sequence numbers received per topic
    """
    total_replayed = 0

    for topic in topics:
        if topic not in last_sequences:
            continue

        since_seq = last_sequences[topic]
        missed_messages = await message_buffer.get_since(topic, since_seq)

        if missed_messages:
            logger.info(f"Replaying {len(missed_messages)} missed messages for topic {topic} (since seq {since_seq})")

            for msg in missed_messages:
                try:
                    await websocket.send_text(json.dumps(msg))
                    total_replayed += 1
                except Exception as e:
                    logger.warning(f"Failed to replay message: {e}")
                    break

    if total_replayed > 0:
        logger.info(f"Replayed {total_replayed} total messages to connection")
