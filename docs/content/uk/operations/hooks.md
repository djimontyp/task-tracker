# Claude Code Hooks (Гачки)

Проєкт використовує Claude Code hooks для автоматизації та перевірок якості.

## Доступні Hooks

### Hook нагадування про документацію

**Файл**: `.claude/hooks/check-docs-after-commits.py`
**Тригер**: Після git комітів (`PostToolUse` з `Bash` matcher)
**Призначення**: Нагадує оновити документацію після середніх/великих змін коду

#### Як працює

1. **Період очікування**: Чекає 60 секунд після першого коміту для завершення серії комітів
2. **Аналіз змін**: Збирає всі зміни з початку серії комітів
3. **Категоризація**: Визначає розмір змін за комбінованими метриками:
   - **Кількість файлів**: 1-2 (малі), 3-5 (середні), 6+ (великі)
   - **Тип коміту**: fix/style (малі), refactor (середні), feat/breaking (великі)
   - **Область файлів**: utils (низька), services/components (середня), routes/models/pages (висока)
4. **Перевірка документації**: Для середніх/великих змін перевіряє наявність відповідної документації
5. **Нагадування**: Показує системне повідомлення з пропозиціями

#### Категорії змін

**Малі зміни** (накопичуються, без негайного нагадування):
- 1-2 файли
- Виправлення багів (`fix:`), стилістичні зміни (`style:`)
- Утиліти/допоміжні функції
- **Накопичуються** в `.pending-doc-updates.json` для SessionEnd summary

**Середні зміни** (негайне м'яке нагадування):
- 3-5 файлів
- Рефакторинг (`refactor:`), оптимізація (`perf:`)
- Шар сервісів, компоненти

**Великі зміни** (негайне сильне нагадування):
- 6+ файлів
- Нові функції (`feat:`), breaking зміни (`feat!:`)
- API роути, моделі бази даних, сторінки

#### Малі зміни ніколи не губляться

Малі зміни **накопичуються**, а не ігноруються:
- Зберігаються в `.claude/hooks/.pending-doc-updates.json`
- Підсумок показується при **SessionEnd** коли:
  - Накопичилося 3+ малих змін, АБО
  - Минуло 24+ годин від останнього нагадування
- Забезпечує повне покриття документацією без порушення робочого процесу

#### Мапінг документації

| Змінені файли | Рекомендована документація |
|---------------|----------------------------|
| `backend/app/api/v1/*.py` | `docs/content/{en,uk}/api/` |
| `backend/app/models/*.py` | `docs/content/{en,uk}/architecture/models.md` |
| `backend/app/services/*.py` | `docs/content/{en,uk}/architecture/backend-services.md` |
| `backend/app/agents/*.py` | `docs/content/{en,uk}/architecture/agent-system.md` |
| `backend/app/tasks/*.py` | `docs/content/{en,uk}/architecture/background-tasks.md` |
| `frontend/src/pages/*.tsx` | `docs/content/{en,uk}/frontend/architecture.md` |
| `frontend/src/features/*/` | Документація відповідної функції |

#### Приклад виводу

```
📚 Documentation Update Reminder:

Detected medium changes in backend (4 files).
Backend areas: API routes, services

Suggested documentation to review/update:
  ✅ docs/content/{en,uk}/api/
  ⚠️ MISSING docs/content/{en,uk}/architecture/backend-services.md

💡 Consider creating missing documentation files using /docs command

Adding to TODO: 'Update documentation for recent changes'
```

#### Конфігурація

Hook налаштовано в `.claude/settings.local.json` (gitignored, локальні override):

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"$CLAUDE_PROJECT_DIR/.claude/hooks/check-docs-after-commits.py\""
          }
        ]
      }
    ]
  }
}
```

#### Налаштування

**Змінити період очікування:**
Відредагуйте `COOLDOWN_SECONDS` в `.claude/hooks/check-docs-after-commits.py` (за замовчуванням: 60)

**Змінити пороги розміру:**
Модифікуйте функції категоризації:
- `categorize_by_file_count()`
- `categorize_by_commit_type()`
- `categorize_by_file_area()`

**Тимчасово вимкнути:**
Закоментуйте hook в `.claude/settings.local.json` або видаліть файли cooldown:
```bash
rm .claude/hooks/.last-commit-check .claude/hooks/.commit-series-start
```

#### Вирішення проблем

**Hook не спрацьовує:**
- Перевірте доступність `python3`: `python3 --version`
- Перевірте права скрипта: `ls -la .claude/hooks/check-docs-after-commits.py`
- Переконайтеся, що `.claude/settings.local.json` має правильну конфігурацію

**Забагато/замало нагадувань:**
- Змініть `COOLDOWN_SECONDS` (збільште для зменшення частоти)
- Модифікуйте пороги в функціях категоризації

**Режим налагодження:**
```bash
# Ручний тест з симульованим вводом
echo '{
  "tool_input": {
    "command": "git commit -m \"test\""
  }
}' | python3 .claude/hooks/check-docs-after-commits.py

# Перевірити стан cooldown
cat .claude/hooks/.last-commit-check
cat .claude/hooks/.commit-series-start
```

## Hooks сесій

### Resume Session Hook

**Файл**: `.claude/hooks/resume-session.sh`
**Тригер**: `SessionStart` з `resume` matcher
**Призначення**: Показує summary сесії при продовженні роботи

### Save Session State Hook

**Файл**: `.claude/hooks/save-session-state.sh`
**Тригер**: `SessionEnd`
**Призначення**: Автоматично зберігає стан сесії для подальшого продовження

## Додавання нових Hooks

Щоб додати власні hooks:

1. Створіть скрипт в `.claude/hooks/`
2. Зробіть виконуваним: `chmod +x .claude/hooks/your-hook.sh`
3. Додайте конфігурацію в `.claude/settings.local.json`:
   ```json
   {
     "hooks": {
       "EventType": [
         {
           "matcher": "optional-matcher",
           "hooks": [
             {
               "type": "command",
               "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/your-hook.sh"
             }
           ]
         }
       ]
     }
   }
   ```

Див. [документацію Claude Code hooks](https://docs.claude.com/en/docs/claude-code/hooks.md) для доступних типів подій та matchers.
