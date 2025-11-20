# React.forwardRef - DOM Access Pattern

**Передача ref через component wrapper**

---

## 🎯 Проблема (Without forwardRef)

**Problem**: ref не працює через custom components.

```typescript
// Custom Button component
function Button({ children, onClick }) {
  return <button onClick={onClick}>{children}</button>
}

// Usage - ❌ ref НЕ працює!
function Form() {
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    buttonRef.current?.focus()  // null! ref не передається
  }, [])

  return <Button ref={buttonRef}>Submit</Button>  // ⚠️ Warning: ref ignored
}
```

**Why**: `ref` - це special prop (як `key`). React не передає його через props.

**Backend analog**:
```python
# Backend: Proxy pattern (FastAPI dependencies)
def get_db():
    db = SessionLocal()  # Real DB connection
    try:
        yield db
    finally:
        db.close()

# Without proxy → cannot access underlying connection
# With proxy (Depends) → can access

# Frontend: Same concept
# Without forwardRef → cannot access DOM element
# With forwardRef → can access
```

---

## ✅ Solution: forwardRef

**forwardRef** = wrapper що forwarding ref до DOM element.

```typescript
import { forwardRef } from 'react'

// ✅ With forwardRef
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, onClick }, ref) => {
    return (
      <button ref={ref} onClick={onClick}>
        {children}
      </button>
    )
  }
)

// Usage - ✅ ref працює!
function Form() {
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    buttonRef.current?.focus()  // ✅ Works! Focus button
  }, [])

  return <Button ref={buttonRef}>Submit</Button>
}
```

**Flow**:
1. Parent: `<Button ref={buttonRef}>` → передає ref
2. forwardRef: приймає ref як 2nd параметр
3. Button: `<button ref={ref}>` → прив'язує ref до DOM
4. Parent: `buttonRef.current` → доступ до `<button>` DOM node

---

## 🧩 Real Example (Button Component)

**File**: `frontend/src/shared/ui/button.tsx:28-45`

```typescript
import { forwardRef } from 'react'
import { Slot } from '@radix-ui/react-slot'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: 'default' | 'destructive' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}  // ← Forward ref to DOM
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'  // For DevTools
```

**Usage**:
```typescript
function FormActions() {
  const submitButtonRef = useRef<HTMLButtonElement>(null)

  const handleSubmit = () => {
    // Disable button during submission
    if (submitButtonRef.current) {
      submitButtonRef.current.disabled = true
    }

    // Submit...
  }

  return (
    <div>
      <Button ref={submitButtonRef} onClick={handleSubmit}>
        Submit
      </Button>
    </div>
  )
}
```

---

## 🎯 Use Cases (When You Need ref)

### 1. Focus Management

```typescript
function SearchInput() {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Auto-focus on mount
    inputRef.current?.focus()
  }, [])

  return <Input ref={inputRef} placeholder="Search..." />
}
```

### 2. Scroll to Element

```typescript
function MessageList({ messages }) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll to bottom on new message
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div>
      {messages.map((msg) => <Message key={msg.id} {...msg} />)}
      <div ref={bottomRef} />  {/* Scroll anchor */}
    </div>
  )
}
```

### 3. Measure Element Size

```typescript
function ResizablePanel() {
  const panelRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const element = panelRef.current
    if (!element) return

    const observer = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width)
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={panelRef}>
      Width: {width}px
    </div>
  )
}
```

### 4. Trigger Native Methods

```typescript
function VideoPlayer({ src }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  const play = () => videoRef.current?.play()
  const pause = () => videoRef.current?.pause()

  return (
    <div>
      <video ref={videoRef} src={src} />
      <button onClick={play}>Play</button>
      <button onClick={pause}>Pause</button>
    </div>
  )
}
```

**Backend analog**:
```python
# Backend: Direct database session access
session = SessionLocal()
session.execute(text("SET lock_timeout = '5s'"))  # Native method

# Frontend: Direct DOM access
inputRef.current.focus()  # Native method
videoRef.current.play()  # Native method
```

---

## 🔧 TypeScript Types

### Pattern 1: Generic Element

```typescript
// Generic ref type
const Component = forwardRef<HTMLDivElement, ComponentProps>(
  (props, ref) => <div ref={ref} {...props} />
)
```

### Pattern 2: Specific Element

```typescript
// Specific element types
const Input = forwardRef<HTMLInputElement, InputProps>(...)
const Button = forwardRef<HTMLButtonElement, ButtonProps>(...)
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(...)
```

### Pattern 3: Union Types

```typescript
// Multiple possible elements
type InputRef = HTMLInputElement | HTMLTextAreaElement

const Field = forwardRef<InputRef, FieldProps>(
  ({ multiline, ...props }, ref) => {
    if (multiline) {
      return <textarea ref={ref as any} {...props} />
    }
    return <input ref={ref as any} {...props} />
  }
)
```

---

## 🎭 displayName (DevTools)

**displayName** = label для React DevTools.

```typescript
const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  return <button ref={ref} {...props} />
})

// ✅ Set displayName
Button.displayName = 'Button'

// DevTools shows:
// <Button>  (замість <ForwardRef>)
```

**Without displayName**:
```
<ForwardRef>  ← Generic name (незручно debug)
  <button>
</ForwardRef>
```

**With displayName**:
```
<Button>  ← Readable name
  <button>
</Button>
```

---

## 🚫 Common Mistakes

### Mistake 1: Забув forwardRef

```typescript
// ❌ BAD - ref ignored
const Input = ({ className }, ref) => {  // ref у props - не працює!
  return <input ref={ref} className={className} />
}

// ✅ GOOD - forwardRef
const Input = forwardRef<HTMLInputElement>((props, ref) => {
  return <input ref={ref} {...props} />
})
```

### Mistake 2: Forwarding до custom component

```typescript
// ❌ BAD - CustomComponent має теж використовувати forwardRef
const Wrapper = forwardRef((props, ref) => {
  return <CustomComponent ref={ref} />  // CustomComponent must use forwardRef!
})

// ✅ GOOD - forward до DOM element
const Wrapper = forwardRef((props, ref) => {
  return <div ref={ref}><CustomComponent /></div>
})
```

### Mistake 3: Multiple refs

```typescript
// ❌ BAD - тільки один ref може бути
<input ref={ref1} ref={ref2} />  // Error!

// ✅ GOOD - merge refs manually
const Input = forwardRef((props, ref) => {
  const internalRef = useRef()

  useEffect(() => {
    // Forward both refs
    if (typeof ref === 'function') {
      ref(internalRef.current)
    } else if (ref) {
      ref.current = internalRef.current
    }
  }, [ref])

  return <input ref={internalRef} />
})
```

---

## 🔄 useImperativeHandle (Advanced)

**Pattern**: Expose custom methods (not DOM element).

```typescript
import { forwardRef, useImperativeHandle, useRef } from 'react'

interface VideoPlayerHandle {
  play: () => void
  pause: () => void
  seek: (time: number) => void
}

const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  ({ src }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null)

    // Expose custom interface
    useImperativeHandle(ref, () => ({
      play: () => videoRef.current?.play(),
      pause: () => videoRef.current?.pause(),
      seek: (time) => {
        if (videoRef.current) {
          videoRef.current.currentTime = time
        }
      },
    }))

    return <video ref={videoRef} src={src} />
  }
)

// Usage
function PlayerControls() {
  const playerRef = useRef<VideoPlayerHandle>(null)

  return (
    <div>
      <VideoPlayer ref={playerRef} src="video.mp4" />
      <button onClick={() => playerRef.current?.play()}>Play</button>
      <button onClick={() => playerRef.current?.seek(10)}>Skip 10s</button>
    </div>
  )
}
```

**Use case**: Expose controlled API замість raw DOM.

---

## 💡 Best Practices

### ✅ DO

1. **Use forwardRef для reusable UI components**:
   ```typescript
   const Button = forwardRef<HTMLButtonElement>((props, ref) => ...)
   const Input = forwardRef<HTMLInputElement>((props, ref) => ...)
   ```

2. **Set displayName**:
   ```typescript
   Button.displayName = 'Button'
   ```

3. **Type ref correctly**:
   ```typescript
   forwardRef<HTMLDivElement, Props>(...)  // ✅ Typed
   ```

### ❌ DON'T

1. **Не overuse refs** (prefer state):
   ```typescript
   // ❌ BAD - use state
   const [value, setValue] = useState('')
   inputRef.current.value = 'new value'  // Mutation!

   // ✅ GOOD - controlled input
   <input value={value} onChange={(e) => setValue(e.target.value)} />
   ```

2. **Не expose DOM element якщо не потрібно**:
   ```typescript
   // Use useImperativeHandle для custom interface
   ```

---

## 🛠️ Практика

1. Відкрий `frontend/src/shared/ui/button.tsx:28-45`
2. Подивись forwardRef setup
3. Створи компонент що використовує Button з ref
4. Focus button programmatically: `buttonRef.current?.focus()`

---

## ❓ FAQ

**Q: Чому ref не працює без forwardRef?**
A: `ref` - special prop (як `key`). React не передає його через props автоматично.

**Q: Коли використовувати useImperativeHandle?**
A: Коли хочеш expose custom API (не raw DOM). Наприклад, VideoPlayer з play/pause methods.

**Q: Чи можна використовувати ref з function components?**
A: Тільки через forwardRef. Без forwardRef → ref ignored.

---

**Повернутись до:** [Module 03: Component Patterns](index.md) | [Composition](composition.md)
