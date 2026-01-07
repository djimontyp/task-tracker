# Правила коду

## Python команди

Проект використовує **uv** для управління залежностями. Завжди запускай Python через `uv run`:

```bash
# ✅ ПРАВИЛЬНО
uv run pytest tests/
uv run python scripts/seed_db.py
uv run mypy app/

# ❌ НЕПРАВИЛЬНО — не знайде залежності
pytest tests/
python scripts/seed_db.py
mypy app/
```

**Або віддавай перевагу just командам:**
```bash
just test          # = uv run pytest
just typecheck     # = uv run mypy
just fmt           # = uv run ruff
```

## Імпорти
```python
# ✅ ПРАВИЛЬНО — абсолютні
from app.models import User
from app.services.embedding import EmbeddingService

# ❌ НЕПРАВИЛЬНО — відносні
from . import User
from ..services import EmbeddingService
```

## Коментарі
- Пояснюй **ЧОМУ**, не **ЩО**
- 80% структурних коментарів = шум
- Код має бути самодокументованим

## ASCII-діаграми та текстова візуалізація

> **TL;DR:** Після створення — ОБОВ'ЯЗКОВО перевір вирівнювання!

**Повні правила:** Use `/ascii-diagrams` skill for complete guidelines

При візуалізації таблиць, wireframes, діаграм у текстових файлах (MD, TXT):
1. **Використовуй monospace** — границі мають бути з однакових символів
2. **Перевіряй ширину** — всі рядки однакової довжини
3. **Тестуй рендер** — переглянь результат перед commit

**Правило:** Якщо рисуєш box — порахуй символи. `─` має бути стільки ж зверху і знизу.

## Принципи

| Принцип | Застосовуй | Ігноруй |
|---------|-----------|---------|
| **KISS** | Завжди | — |
| **DRY** | Бізнес-логіка, сервіси | Тести (явність > абстракція) |
| **YAGNI** | Завжди — не роби "про запас" | — |

## Заборонено

- ❌ Змінювати `pyproject.toml` / `package.json` без схвалення
- ❌ Комітити `.env`, secrets, credentials
- ❌ Force push до main/master
- ❌ Пропускати `just typecheck` після Python змін
