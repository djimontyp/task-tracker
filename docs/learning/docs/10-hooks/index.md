# Module 10: Custom Hooks

**Reusable logic через React hooks**

---

## 🎯 Що це

**Hooks** - функції для reusable logic. Built-in hooks (useState, useEffect) + custom hooks (useDebounce, useTheme).

**Key pattern:** Hook = function що використовує інші hooks

---

## 🔄 Backend аналогія

| Backend (Python) | Frontend (Hooks) |
|-----------------|-----------------|
| Decorator (`@timer`) | Custom hook (`useTimer`) |
| Context manager (`with db`) | useEffect cleanup |
| Function composition | Hook composition |
| Shared utilities | Custom hooks |

```python
# Backend (decorator pattern)
def with_db(func):
    def wrapper(*args, **kwargs):
        db = connect()
        try:
            return func(db, *args, **kwargs)
        finally:
            db.close()
    return wrapper

# Frontend (custom hook analog)
function useDatabase() {
    const [db, setDb] = useState(null)

    useEffect(() => {
        const connection = connect()
        setDb(connection)
        return () => connection.close()
    }, [])

    return db
}
```

---

## 📂 У твоєму проекті

**Built-in hooks usage:**
- `useState` - state management (200+ uses)
- `useEffect` - lifecycle, side effects (100+ uses)
- `useRef` - DOM refs, mutable values
- `useContext` - theme provider

**Custom hooks:**
- `src/shared/hooks/useDebounce.ts` - debounce pattern (search input)
- `src/shared/components/ThemeProvider/ThemeProvider.tsx` - useTheme hook
- `src/features/websocket/hooks/useWebSocket.ts` - complex WebSocket hook

---

## 💡 Ключові концепції

### 1. Built-in Hooks

**useState** - state:
```typescript
const [count, setCount] = useState(0)
```

**useEffect** - side effects:
```typescript
useEffect(() => {
    fetchData()
    return () => cleanup()
}, [deps])
```

**useRef** - mutable ref:
```typescript
const inputRef = useRef<HTMLInputElement>(null)
```

**useContext** - consume context:
```typescript
const theme = useContext(ThemeContext)
```

### 2. Custom Hooks Rules

- ✅ Name starts with `use`
- ✅ Can call other hooks
- ✅ Only call at top level (не в loops/conditions)
- ✅ Only in components або інших hooks

### 3. Hook Composition
Custom hook може використовувати інші hooks (built-in або custom)

---

## ✅ Коли створювати custom hook

- ✅ Logic reused в 2+ компонентах
- ✅ Складна логіка (WebSocket, debounce)
- ✅ Side effects з cleanup

## ❌ Коли НЕ створювати

- ❌ Used в одному місці only
- ❌ Просто wrapper навколо useState (over-engineering)

---

## 🚫 Типові Помилки

### 1. Hooks в Loops/Conditions
```tsx
// ❌ НЕ РОБИ
if (condition) {
  const [count, setCount] = useState(0)  // ❌ Conditional hook!
}

// ✅ РОБИ: Top level
const [count, setCount] = useState(0)
```

### 2. Забуті Dependencies
```tsx
// ❌ НЕ РОБИ: Stale closure
useEffect(() => {
  console.log(count)  // Завжди 0!
}, [])  // ❌ Забув count

// ✅ РОБИ
useEffect(() => {
  console.log(count)
}, [count])  // ✅ Fresh value
```

### 3. Custom Hook Без `use` Prefix
```tsx
// ❌ НЕ РОБИ
function fetchData() {  // ❌ Не починається з "use"
  return useQuery(['data'], fetchFn)
}

// ✅ РОБИ
function useFetchData() {  // ✅ Починається з "use"
  return useQuery(['data'], fetchFn)
}
```

### 4. useRef для State
```tsx
// ❌ НЕ РОБИ: useRef для UI state
const countRef = useRef(0)
countRef.current++  // ❌ Не ре-рендериться!

// ✅ РОБИ: useState для UI
const [count, setCount] = useState(0)
```

---

## 📚 Офіційна документація

- [Hooks Overview](https://react.dev/reference/react/hooks) ✅
- [useState](https://react.dev/reference/react/useState) ✅
- [useEffect](https://react.dev/reference/react/useEffect) ✅
- [useRef](https://react.dev/reference/react/useRef) ✅
- [Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks) ✅

---

## 🛠️ Практика

1. Відкрий `src/shared/hooks/useDebounce.ts`
2. Подивись як використовується useState + useEffect
3. Знайди використання useDebounce в search inputs
4. Спробуй створити свій hook (useLocalStorage, useInterval)

**Estimated time:** 2-3 години

---

## ❓ FAQ

**Q: Чому hook має починатися з 'use'?**
A: Convention + ESLint rules для перевірки. Без 'use' = не hook.

**Q: Можна викликати hooks в loops?**
A: ❌ НІ! Hooks мають викликатись в тому ж порядку кожен render.

**Q: useEffect vs useLayoutEffect?**
A: useEffect = after paint. useLayoutEffect = before paint (рідко потрібен).

---

**Далі:** [Built-in Hooks](built-in-hooks.md) | [Your Custom Hooks Breakdown](your-hooks.md)

**Повернутись до:** [Learning Home](../index.md)
