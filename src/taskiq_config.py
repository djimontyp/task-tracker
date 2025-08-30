"""
Конфігурація TaskIQ з використанням NATS
"""

from taskiq_nats import NatsBroker, NATSObjectStoreResultBackend
from config import settings

# Ініціалізація брокера NATS з додатковими параметрами
nats_broker = NatsBroker(
    servers=settings.taskiq_nats_servers,
    queue=settings.taskiq_nats_queue,
    # Додаткові параметри для покращення стабільності підключення
    connect_timeout=10,
    drain_timeout=30,
    max_reconnect_attempts=-1,  # Нескінченна кількість спроб перепідключення
)

# Ініціалізація бекенду результатів
result_backend = NATSObjectStoreResultBackend(
    servers=settings.taskiq_nats_servers,
)

# Налаштування брокера з бекендом результатів
nats_broker = nats_broker.with_result_backend(result_backend)

# Експортуємо брокера та бекенд для використання в інших частинах додатку
__all__ = ["nats_broker", "result_backend"]
