# 📱 Telegram Message Ingestion Setup

Цей гайд допоможе налаштувати підгрузку історичних повідомлень з Telegram груп.

## 🔑 Крок 1: Отримати API Credentials

1. Відкрий https://my.telegram.org/apps
2. Залогінься через свій номер телефону
3. Заповни форму створення додатку:
   - **App title**: Task Tracker
   - **Short name**: task_tracker
   - **Platform**: Other
4. Натисни **Create application**
5. Скопіюй **api_id** та **api_hash**

## ⚙️ Крок 2: Налаштувати Environment

Додай в `.env` файл:

```bash
# Telegram Client API (для підгрузки історичних повідомлень)
TELEGRAM_API_ID=12345678
TELEGRAM_API_HASH=0123456789abcdef0123456789abcdef
```

## 🔐 Крок 3: Авторизація (один раз)

Запусти скрипт авторизації:

```bash
cd backend
uv run python scripts/telegram_auth.py
```

Скрипт попросить:
1. **Номер телефону** (з кодом країни, наприклад: +380123456789)
2. **Код підтвердження** (прийде в Telegram)
3. **2FA пароль** (якщо ввімкнено двофакторну аутентифікацію)

Після успішної авторизації створиться файл `task_tracker.session` - **НЕ видаляй його!**

## ✅ Крок 4: Перевірка

Після авторизації можеш використовувати підгрузку повідомлень:

1. Відкрий http://localhost/messages
2. Натисни **"Ingest Messages"**
3. Вибери групи з списку
4. Натисни **"Ingest from N group(s)"**

## 🔒 Безпека

- ✅ `api_id` та `api_hash` - можна зберігати в `.env`
- ❌ `task_tracker.session` - **НЕ комітити в git!** (вже в `.gitignore`)
- ⚠️ Session файл містить токени доступу до твого Telegram акаунту

## 🐛 Troubleshooting

### "Telegram API credentials not configured"
Перевір що `TELEGRAM_API_ID` та `TELEGRAM_API_HASH` встановлені в `.env`

### "Not authorized"
Запусти `python scripts/telegram_auth.py` для авторизації

### "Client not connected"
Переконайся що session файл `task_tracker.session` існує

### "Error fetching messages"
Перевір що бот/акаунт має доступ до групи

## 📚 Додаткова інформація

- **Bot API** - тільки нові повідомлення через webhook
- **Client API (Telethon)** - історичні повідомлення (потребує auth)
- Документація Telegram API: https://core.telegram.org/api
- Telethon docs: https://docs.telethon.dev/
