# Module 08: Forms

**react-hook-form + Zod validation**

---

## 🎯 Що це

**react-hook-form** - бібліотека для форм без re-renders. **Zod** - schema validation (як Pydantic для frontend).

**Key pattern:** `useForm()` + `zodResolver` + `handleSubmit()`

---

## 🔄 Backend аналогія

| Backend (Pydantic) | Frontend (Zod) |
|-------------------|---------------|
| `class User(BaseModel)` | `z.object({ ... })` |
| `name: str` | `name: z.string()` |
| `age: int = Field(gt=0)` | `age: z.number().positive()` |
| Validation on request | Validation on submit |
| `ValidationError` | Form errors object |

```python
# Backend (Pydantic)
class CreateUser(BaseModel):
    name: str = Field(min_length=2)
    email: EmailStr
    age: int = Field(gt=0)

# Frontend (Zod analog)
const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    age: z.number().positive()
})
```

---

## 📂 У твоєму проекті

**Form example:**
- `src/features/atoms/components/CreateAtomDialog.tsx:39-127` - повна форма

**Pattern breakdown:**
1. **Zod schema** (lines 39-52):
   ```typescript
   const formSchema = z.object({
       title: z.string().min(2),
       description: z.string().optional()
   })
   ```

2. **Form setup** (lines 72-87):
   ```typescript
   const form = useForm({
       resolver: zodResolver(formSchema),
       defaultValues: { title: "", description: "" }
   })
   ```

3. **Form render** (lines 89-127):
   - `<form onSubmit={form.handleSubmit(onSubmit)}>`
   - `<input {...form.register("title")}>`
   - `{form.formState.errors.title?.message}`

---

## 💡 Ключові концепції

### 1. useForm() Hook
`useForm()` → `{ register, handleSubmit, formState }` object

### 2. zodResolver
Connect Zod schema → react-hook-form validation

### 3. register()
Bind input to form: `{...register("name")}`

### 4. handleSubmit()
`onSubmit={handleSubmit(onFormSubmit)}` - validation + callback

### 5. formState.errors
Validation errors: `errors.name?.message`

### 6. defaultValues
Initial form values (як constructor defaults)

---

## ✅ Коли використовувати

- ✅ Forms з validation
- ✅ Complex validation rules
- ✅ Type-safe forms (TypeScript)
- ✅ Performance critical (no re-renders)

## ❌ Коли НЕ використовувати

- ❌ Single input (use useState)
- ❌ No validation needed
- ❌ Simple search box

---

## 🚫 Типові Помилки

### 1. HTML5 Validation Замість Zod

```tsx
// ❌ НЕ РОБИ: HTML5 validation - немає type safety
<input
  type="email"
  required
  minLength={8}  // ❌ HTML5 attributes - втрата TypeScript types
/>

// ✅ РОБИ: Zod schema з react-hook-form
const schema = z.object({
  email: z.string().email('Invalid email'),  // ✅ Type-safe + custom messages
  password: z.string().min(8, 'Min 8 characters'),
})

const { register } = useForm({ resolver: zodResolver(schema) })

<input {...register('email')} />  // ✅ Validated через Zod
```

**Чому:** HTML5 validation не дає type safety. Zod перевіряє на compile-time + runtime.

**Backend Аналогія:**
```python
# Pydantic validation (схоже на Zod)
class UserCreate(BaseModel):
    email: EmailStr  # Auto email validation
    password: str = Field(min_length=8)
```

---

### 2. Не Показують Inline Errors

```tsx
// ❌ НЕ РОБИ: Errors тільки в console
const { register, formState: { errors } } = useForm()
console.log(errors)  // ❌ User не бачить помилок!

<input {...register('email')} />

// ✅ РОБИ: Показуй errors inline
<div>
  <input {...register('email')} />
  {errors.email && (
    <span className="text-red-500">{errors.email.message}</span>  // ✅ User feedback
  )}
</div>
```

**Чому:** UX critical - user повинен знати ЩО не так.

**Де Показувати:**
- Under input (найкраще)
- Toast notification (для global errors)
- Summary list (для multi-step forms)

---

### 3. Забули Disable Submit Під Час Submission

```tsx
// ❌ НЕ РОБИ: Submit button завжди активна - double submission!
const onSubmit = async (data) => {
  await api.createUser(data)  // ❌ User може клікнути 2 рази → 2 users created!
}

<Button type="submit">Create</Button>

// ✅ РОБИ: Disable під час isSubmitting
const { formState: { isSubmitting } } = useForm()

const onSubmit = async (data) => {
  await api.createUser(data)
}

<Button type="submit" disabled={isSubmitting}>
  {isSubmitting ? 'Creating...' : 'Create'}  // ✅ Visual feedback
</Button>
```

**Чому:** Network може бути повільним. User клікає 2 рази → duplicate submissions.

**Backend Аналогія:**
```python
# Idempotency key для захисту від double submission
@router.post("/users")
async def create_user(
    data: UserCreate,
    idempotency_key: str = Header(...)  # Prevent duplicates
):
    ...
```

---

### 4. Client-Side Validation Без Server-Side

```tsx
// ❌ НЕ РОБИ: Тільки client validation - небезпечно!
const schema = z.object({
  email: z.string().email(),
})

// ✅ РОБИ: Client + Server validation
// Frontend
const schema = z.object({
  email: z.string().email(),  // Client validation (UX)
})

const onSubmit = async (data) => {
  try {
    await api.createUser(data)
  } catch (error) {
    if (error.status === 400) {  // ✅ Server validation errors
      setError('email', { message: error.message })
    }
  }
}

// Backend (FastAPI)
@router.post("/users")
async def create_user(data: UserCreate):  # Server validation (security)
    if await user_exists(data.email):
        raise HTTPException(400, "Email already exists")
```

**Чому:** Client validation = UX. Server validation = SECURITY. Потрібні обидва!

**Never Trust Client:**
- User може відключити JavaScript
- Може змінити network requests (Postman/curl)
- Завжди validate на server

---

### 5. Не Використовують mode: 'onBlur' для Кращої UX

```tsx
// ❌ НЕ РОБИ: Default mode = onSubmit (показує errors тільки після submit)
const { register } = useForm()  // ❌ User бачить errors тільки після submit click

<input {...register('email')} />
<Button type="submit">Submit</Button>  // Клік → бум, всі errors одразу

// ✅ РОБИ: mode: 'onBlur' - показує errors коли user покидає поле
const { register } = useForm({
  mode: 'onBlur',  // ✅ Show errors as user fills form
})

<input {...register('email')} />  // Typed "test" → blur → error shown
```

**Modes:**
- `onSubmit` (default) - errors після submit (frustrating UX)
- `onBlur` - errors коли покидає поле (краща UX)
- `onChange` - errors на кожен keystroke (занадто aggressive)
- `all` - onBlur + onChange (оптимально для складних форм)

**Чому:** Instant feedback краще за delayed shock.

**Backend Аналогія:**
```python
# Як streaming validation замість batch
# onBlur = validate field by field (streaming)
# onSubmit = validate all at once (batch)
```

---

## 📚 Офіційна документація

- [react-hook-form Docs](https://react-hook-form.com/) ✅
- [Get Started](https://react-hook-form.com/get-started) ✅
- [Zod Resolver](https://github.com/react-hook-form/resolvers#zod) ✅
- [Zod Docs](https://zod.dev/) ✅

---

## 🛠️ Практика

1. Відкрий `src/features/atoms/components/CreateAtomDialog.tsx`
2. Знайди Zod schema (lines 39-52)
3. Подивись form setup з zodResolver
4. Спробуй submit з порожніми полями → validation errors
5. Fill form → submit → success

**Estimated time:** 2-3 години

---

## ❓ FAQ

**Q: react-hook-form vs Formik?**
A: react-hook-form швидший (no re-renders), менший bundle.

**Q: Навіщо Zod якщо є HTML5 validation?**
A: Type safety, complex rules, consistent backend/frontend validation.

**Q: Як показати error messages?**
A: `{errors.name?.message}` → render під input.

---

**Далі:** [react-hook-form Deep Dive](react-hook-form.md) | [Zod Validation](zod-validation.md)

**Повернутись до:** [Learning Home](../index.md)
