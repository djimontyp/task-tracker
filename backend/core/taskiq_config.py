from taskiq_nats import NatsBroker, NATSObjectStoreResultBackend

from .config import settings

nats_broker = NatsBroker(
    servers=settings.taskiq_nats_servers,
    queue=settings.taskiq_nats_queue,
    connect_timeout=10,
    drain_timeout=30,
    max_reconnect_attempts=-1,  # The endless number of re -attachment attempts
)

result_backend = NATSObjectStoreResultBackend(servers=settings.taskiq_nats_servers)

nats_broker = nats_broker.with_result_backend(result_backend)

__all__ = ["nats_broker", "result_backend"]
