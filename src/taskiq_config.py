"""
Конфігурація TaskIQ з використанням NATS
"""

from taskiq_nats import NatsBroker, NATSObjectStoreResultBackend
from config import settings

# Ініціалізація брокера NATS
nats_broker = NatsBroker(
    servers=settings.taskiq_nats_servers,
    queue=settings.taskiq_nats_queue,
)

# Ініціалізація бекенду результатів
result_backend = NATSObjectStoreResultBackend(
    servers=settings.taskiq_nats_servers,
)

# Налаштування брокера з бекендом результатів
nats_broker = nats_broker.with_result_backend(result_backend)

# Експортуємо брокера та бекенд для використання в інших частинах додатку
__all__ = ["nats_broker", "result_backend"]
