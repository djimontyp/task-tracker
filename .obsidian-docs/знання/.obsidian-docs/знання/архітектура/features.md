---
title: "Features"
created: 2025-12-27
tags:
  - архітектура
  - features
status: active
---

# Features

==18 ізольованих domain modules==

## Структура модуля

```
features/{name}/
├── api/        # Service
├── components/ # UI
├── types/      # TS
└── index.ts    # Public API
```

## Основні

| Feature | Store |
|---------|-------|
| atoms | - |
| messages | ✅ |
| agents | - |
| websocket | - |

> [!warning] Ізоляція
> Features ==не імпортують== одне одного

## Пов'язане

- [[шари-фронтенду]] — архітектура
- [[shared-layer]] — reusable код
