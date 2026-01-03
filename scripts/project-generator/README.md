# Project Generator — Генератор проектів з YAML фікстур

Система генерації повної структури проекту (Backend + Frontend) з одного YAML файлу.

## Що це?

**Концепція:** Як Django fixtures, але для всієї структури проекту — моделі, API endpoints, React компоненти, конфігурація.

**Переваги:**
- 📝 Декларативний опис проекту в YAML
- 🚀 Швидке створення нових проектів
- 🔄 Консистентна структура
- 📦 Згенеровані файли готові до розширення

---

## Швидкий старт

### 1️⃣ Генерація FeodalMe проекту

```bash
# Згенерувати в батьківську директорію (../feudalme)
just generate-feudalme

# Або в кастомне місце
just generate-feudalme /path/to/output
```

### 2️⃣ Перегляд доступних фікстур

```bash
just list-fixtures
```

### 3️⃣ Генерація з кастомної фікстури

```bash
just generate-project path/to/fixture.yaml /output/dir
```

---

## Структура фікстури

Дивись `fixture-schema.yaml` для повної схеми.

### Приклад (мінімальний)

```yaml
project:
  name: my-app
  display_name: My App
  description: My application
  version: 0.1.0

  tech_stack:
    backend:
      language: Python 3.12
      framework: FastAPI
      orm: SQLModel
      database: PostgreSQL

    frontend:
      framework: React 18
      language: TypeScript
      build_tool: Vite
      ui_library: shadcn/ui

  # Моделі (SQLModel)
  models:
    - name: User
      table_name: users
      description: Application user
      fields:
        - name: id
          type: int
          description: Primary key
        - name: email
          type: str
          description: Email address

  # API Endpoints (FastAPI)
  endpoints:
    - path: /api/v1/users
      tag: Users
      methods:
        - method: GET
          summary: List users
          response_model: List[User]

  # React компоненти
  components:
    - name: UserCard
      path: features/users/components
      type: functional
      props:
        - name: user
          type: User
          required: true
```

---

## Що генерується?

### Backend (Python + FastAPI)

```
backend/
├── app/
│   ├── models/          # SQLModel моделі
│   │   ├── user.py
│   │   └── ...
│   ├── api/            # FastAPI routers
│   │   ├── users.py
│   │   └── ...
│   ├── services/       # Бізнес-логіка (порожня)
│   └── core/           # Конфігурація (порожня)
├── tests/              # Тести (порожня)
└── pyproject.toml      # Залежності
```

**Згенерований код:**

```python
# backend/app/models/user.py
"""
Application user model
"""
from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime
from typing import Optional, List

class User(SQLModel, table=True):
    __tablename__ = "users"

    id: int = Field(description="Primary key", primary_key=True)
    email: str = Field(description="Email address")
```

```python
# backend/app/api/users.py
"""
Users API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

router = APIRouter(prefix="/api/v1/users", tags=["Users"])

@router.get("/", summary="List users", response_model=List[User])
async def get_users():
    """
    List users
    """
    # TODO: Implement
    raise HTTPException(status_code=501, detail="Not implemented")
```

### Frontend (React + TypeScript)

```
frontend/
├── src/
│   ├── features/           # Feature modules
│   │   └── users/
│   │       └── components/
│   │           └── UserCard.tsx
│   └── shared/            # Shared UI/libs (порожня)
└── package.json           # Залежності
```

**Згенерований код:**

```tsx
// frontend/src/features/users/components/UserCard.tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card'
import { useState } from 'react'

interface UserCardProps {
  user: User
}

export function UserCard({ user }: UserCardProps) {
  // TODO: Implement
  return (
    <div>
      <h2>UserCard</h2>
    </div>
  )
}
```

---

## Приклад: FeodalMe

Фікстура FeodalMe (`fixtures/feudalme.yaml`) демонструє повний проект:

**Згенеровано:**
- ✅ 5 моделей (User, LandPlot, RentCompany, Review, Investment)
- ✅ 5 API endpoints (Users, Land Plots, Rent Companies, Reviews, Investments)
- ✅ 4 React компоненти (LandPlotCard, RentCompanyCard, ReviewCard, InvestmentPortfolio)
- ✅ README.md з документацією
- ✅ pyproject.toml + package.json
- ✅ Структура каталогів (22 директорії)

**Команда:**

```bash
just generate-feudalme ../
# Результат: ../feudalme/
```

**Результат:**

```
feudalme/
├── backend/
│   ├── app/
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── landplot.py
│   │   │   ├── rentcompany.py
│   │   │   ├── review.py
│   │   │   └── investment.py
│   │   └── api/
│   │       ├── users.py
│   │       ├── land_plots.py
│   │       ├── rent_companies.py
│   │       ├── reviews.py
│   │       └── investments.py
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   └── features/
│   │       ├── land-plots/components/LandPlotCard.tsx
│   │       ├── rent-companies/components/RentCompanyCard.tsx
│   │       ├── reviews/components/ReviewCard.tsx
│   │       └── investments/components/InvestmentPortfolio.tsx
│   └── package.json
└── README.md
```

---

## Розширення фікстур

### Додати нову фікстуру

1. Створи файл `scripts/project-generator/fixtures/my-project.yaml`
2. Опиши структуру (дивись `feudalme.yaml` як приклад)
3. Згенеруй:

```bash
just generate-project scripts/project-generator/fixtures/my-project.yaml /output
```

### Структура YAML

**Основні секції:**

| Секція | Опис | Приклад |
|--------|------|---------|
| `project.name` | Назва проекту (lowercase) | `feudalme` |
| `project.tech_stack` | Технології | `backend: {framework: FastAPI}` |
| `directories` | Список директорій | `- path: backend/app` |
| `models` | SQLModel моделі | `- name: User, fields: [...]` |
| `endpoints` | FastAPI endpoints | `- path: /api/v1/users` |
| `components` | React компоненти | `- name: UserCard, props: [...]` |
| `files` | Статичні файли | `- path: README.md, content: "..."` |

**Повна документація:** `fixture-schema.yaml`

---

## Подальший розвиток

### TODO

- [ ] Темплейти через Jinja2 (поки що тільки static)
- [ ] Генератори для Services (business logic)
- [ ] Database migrations (Alembic)
- [ ] Docker Compose configuration
- [ ] Тести (pytest + Vitest scaffolds)
- [ ] CI/CD pipelines (GitHub Actions)

### Ідеї

- 🎨 Інтерактивний CLI wizard (як `npm create vite`)
- 🌐 Web UI для створення фікстур
- 📦 Marketplace фікстур (community templates)
- 🔄 Інкрементальна генерація (додавання до існуючого проекту)

---

## Технічні деталі

**Залежності:**
- `pyyaml` — парсинг YAML
- `jinja2` — темплейти (майбутнє)
- `pydantic` — валідація структури

**Валідація:**
Фікстура валідується через Pydantic моделі перед генерацією.

**Помилки:**
- `ScannerError` — синтаксична помилка YAML (перевір двокрапки, відступи)
- `ValidationError` — невірна структура (перевір схему)

---

## Приклади використання

### 1. Швидкий прототип

```bash
# Створи базову YAML фікстуру
cat > /tmp/prototype.yaml <<EOF
project:
  name: my-prototype
  display_name: My Prototype
  description: Quick prototype
  version: 0.1.0
  tech_stack:
    backend:
      language: Python 3.12
      framework: FastAPI
      orm: SQLModel
      database: PostgreSQL
    frontend:
      framework: React 18
      language: TypeScript
      build_tool: Vite
      ui_library: shadcn/ui
  models:
    - name: Item
      table_name: items
      fields:
        - name: id
          type: int
        - name: title
          type: str
EOF

# Згенеруй проект
just generate-project /tmp/prototype.yaml ../

# Результат: ../my-prototype/
```

### 2. Модифікація існуючої фікстури

```bash
# Скопіюй FeodalMe фікстуру
cp scripts/project-generator/fixtures/feudalme.yaml /tmp/my-project.yaml

# Відредагуй (зміни name, models, тощо)
vim /tmp/my-project.yaml

# Згенеруй
just generate-project /tmp/my-project.yaml ../
```

---

## Підтримка

**Питання?** Дивись приклади в `fixtures/` директорії.

**Баги?** Перевір YAML синтаксис (онлайн: yamllint.com).

**Нові фічі?** Додай в TODO секцію цього README.

---

**Створено:** 2026-01-03
**Версія:** 1.0.0
