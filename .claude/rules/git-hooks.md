# Git Hooks (Автоматична перевірка)

> **TL;DR:** Pre-commit hook **блокує** commits з порушеннями Design System

## 🔒 Pre-commit Hook

**Що перевіряється:**
```bash
# 1. ESLint (Design System rules)
#    - Заборонені raw кольори (bg-red-*, text-green-*)
#    - Заборонені непарні spacing (gap-3, p-5, p-7)
#    - TypeScript errors

# 2. TypeScript compilation
#    - tsc --noEmit (type checking)
```

**Налаштовано через:**
- `.husky/pre-commit` — Git hook script
- `frontend/package.json` → `lint-staged` — incremental checks

**Приклад блокування:**

```bash
$ git commit -m "Add new badge"

🔍 Running pre-commit checks...

✖ eslint --fix --max-warnings 0:
  12:14  error  ❌ Raw Tailwind color "bg-green-500" is forbidden.
         Use semantic token: semantic-success, status-connected

✖ 4 problems (4 errors, 0 warnings)

husky - pre-commit script failed (code 1)
```

**Обхід (тільки у надзвичайних випадках):**
```bash
git commit --no-verify -m "Emergency fix"
```

## 📋 Що робить lint-staged

Перевіряє **тільки staged files** (не весь проект):

```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix --max-warnings 0",  // Auto-fix + block if errors
      "bash -c 'tsc --noEmit'"          // Type check
    ]
  }
}
```

**Переваги:**
- ✅ Швидко — перевіряє тільки змінені файли
- ✅ Auto-fix — виправляє що можна автоматично
- ✅ Блокує commit — неможливо закомітити порушення

## 🧪 Тестування Hook

```bash
# Створи файл з порушенням
cat > frontend/src/test.tsx <<EOF
export const Bad = () => <div className="bg-red-500">Test</div>;
EOF

# Спробуй закомітити
git add frontend/src/test.tsx
git commit -m "test"

# Результат: ❌ BLOCKED з описом помилки
```

**Дивись:** `frontend/src/test-violations.tsx` — приклад файлу який блокується
