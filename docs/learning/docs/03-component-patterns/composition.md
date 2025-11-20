# Composition Pattern - Compound Components

**Складання UI з дрібних частин**

---

## 🎯 Що таке Composition

**Composition** = складання компонентів з дрібних частин замість монолітного компонента з 20 props.

```typescript
// ❌ Configuration approach (монолітний)
<Dialog
  title="Create Project"
  description="Enter project details"
  content={<ProjectForm />}
  footer={
    <>
      <Button onClick={onCancel}>Cancel</Button>
      <Button onClick={onSubmit}>Create</Button>
    </>
  }
  showCloseButton={true}
  size="large"
/>

// ✅ Composition approach (гнучкий)
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create Project</DialogTitle>
      <DialogDescription>Enter project details</DialogDescription>
    </DialogHeader>

    <ProjectForm />

    <DialogFooter>
      <Button onClick={onCancel}>Cancel</Button>
      <Button onClick={onSubmit}>Create</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Backend analog**:
```python
# Configuration approach (як FastAPI dependencies)
@router.get("/users", dependencies=[Depends(auth), Depends(rate_limit)])

# Composition approach (як middleware stack)
app.middleware('http')(auth_middleware)
app.middleware('http')(rate_limit_middleware)
# Більше гнучкості - можна комбінувати як хочеш
```

---

## 🧩 Dialog Composition (Real Example)

**File**: `frontend/src/shared/ui/dialog.tsx:1-121`

### Structure

```typescript
// Root component (provides context)
const Dialog = DialogPrimitive.Root

// Trigger (opens dialog)
const DialogTrigger = DialogPrimitive.Trigger

// Portal (renders outside DOM tree)
const DialogPortal = DialogPrimitive.Portal

// Overlay (backdrop)
const DialogOverlay = forwardRef<HTMLDivElement>((props, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className="fixed inset-0 bg-black/50"
    {...props}
  />
))

// Content (main container)
const DialogContent = forwardRef<HTMLDivElement>((props, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      {...props}
    />
  </DialogPortal>
))

// Header, Footer, Title (layout parts)
const DialogHeader = ({ children }) => <div className="space-y-2">{children}</div>
const DialogFooter = ({ children }) => <div className="flex gap-2">{children}</div>
const DialogTitle = DialogPrimitive.Title
```

### Usage Pattern

```typescript
function CreateProjectDialog({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Enter project name and description
          </DialogDescription>
        </DialogHeader>

        {/* Custom content */}
        <ProjectForm onSubmit={handleSubmit} />

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit">Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

**Flexibility**:
- Можеш пропустити DialogFooter (no buttons)
- Можеш додати custom content між Header і Footer
- Можеш змінити порядок (Footer → Header)

---

## 🔗 Compound Components (Context Sharing)

**Pattern**: Root component містить context → дочірні читають context.

```typescript
// Root component з context
const TabsContext = createContext<{ activeTab: string }>({ activeTab: '' })

const Tabs = ({ defaultValue, children }) => {
  const [activeTab, setActiveTab] = useState(defaultValue)

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  )
}

// Child component читає context
const TabsTrigger = ({ value, children }) => {
  const { activeTab, setActiveTab } = useContext(TabsContext)

  return (
    <button
      onClick={() => setActiveTab(value)}
      className={activeTab === value ? 'active' : ''}
    >
      {children}
    </button>
  )
}

const TabsContent = ({ value, children }) => {
  const { activeTab } = useContext(TabsContext)

  if (activeTab !== value) return null
  return <div>{children}</div>
}
```

**Usage**:
```typescript
<Tabs defaultValue="general">
  <TabsList>
    <TabsTrigger value="general">General</TabsTrigger>
    <TabsTrigger value="advanced">Advanced</TabsTrigger>
  </TabsList>

  <TabsContent value="general">
    <GeneralSettings />
  </TabsContent>

  <TabsContent value="advanced">
    <AdvancedSettings />
  </TabsContent>
</Tabs>
```

**Backend analog**:
```python
# Backend: Request context (Flask/FastAPI)
# Root provides context
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request.state.request_id = generate_id()  # Context
    response = await call_next(request)
    return response

# Children read context
def log_request(request: Request):
    print(f"Request ID: {request.state.request_id}")  # Read context

# Frontend: Compound components з context
<Tabs>  {/* Provides activeTab context */}
  <TabsTrigger />  {/* Reads activeTab */}
  <TabsContent />  {/* Reads activeTab */}
</Tabs>
```

---

## 📦 Card Composition

**File**: `frontend/src/shared/ui/card.tsx:5-77`

```typescript
const Card = forwardRef<HTMLDivElement>((props, ref) => (
  <div ref={ref} className="rounded-lg border bg-card" {...props} />
))

const CardHeader = forwardRef<HTMLDivElement>((props, ref) => (
  <div ref={ref} className="p-6 space-y-1.5" {...props} />
))

const CardTitle = forwardRef<HTMLParagraphElement>((props, ref) => (
  <h3 ref={ref} className="text-2xl font-semibold" {...props} />
))

const CardDescription = forwardRef<HTMLParagraphElement>((props, ref) => (
  <p ref={ref} className="text-sm text-muted-foreground" {...props} />
))

const CardContent = forwardRef<HTMLDivElement>((props, ref) => (
  <div ref={ref} className="p-6 pt-0" {...props} />
))

const CardFooter = forwardRef<HTMLDivElement>((props, ref) => (
  <div ref={ref} className="flex items-center p-6 pt-0" {...props} />
))
```

**Usage Examples**:

```typescript
// Pattern 1: Full card
<Card>
  <CardHeader>
    <CardTitle>Project Status</CardTitle>
    <CardDescription>12 active projects</CardDescription>
  </CardHeader>
  <CardContent>
    <ProjectStats />
  </CardContent>
  <CardFooter>
    <Button>View All</Button>
  </CardFooter>
</Card>

// Pattern 2: Minimal card (no header/footer)
<Card>
  <CardContent>
    <SimpleMetric value={42} />
  </CardContent>
</Card>

// Pattern 3: Custom order (footer first)
<Card>
  <CardFooter>
    <Badge>New</Badge>
  </CardFooter>
  <CardContent>
    <FeatureDescription />
  </CardContent>
</Card>
```

**Flexibility**: Можеш комбінувати частини як хочеш.

---

## 🎭 children Pattern

**Pattern**: Render nested content через `children` prop.

```typescript
// Component definition
const Container = ({ children, className }) => (
  <div className={`max-w-7xl mx-auto ${className}`}>
    {children}
  </div>
)

// Usage (nested content)
<Container className="py-8">
  <Header />
  <MainContent />
  <Footer />
</Container>
```

**Backend analog**:
```python
# Backend: Context manager (with statement)
with database_transaction():  # Context manager
    # Nested operations
    user = create_user(data)
    send_email(user)
    log_activity(user)

# Frontend: children pattern
<Container>
  {/* Nested components */}
  <CreateUser />
  <SendEmail />
  <LogActivity />
</Container>
```

---

## 🔧 Practical Patterns

### Pattern 1: Optional Parts

```typescript
function ProjectCard({ project, showActions = true }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{project.name}</CardTitle>
        <CardDescription>{project.description}</CardDescription>
      </CardHeader>

      <CardContent>
        <ProjectStats stats={project.stats} />
      </CardContent>

      {/* Optional footer */}
      {showActions && (
        <CardFooter>
          <Button>Edit</Button>
          <Button variant="destructive">Delete</Button>
        </CardFooter>
      )}
    </Card>
  )
}
```

### Pattern 2: Composition з props

```typescript
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="max-w-4xl">
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
    </DialogHeader>

    {children}

    <DialogFooter className="justify-between">
      <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      <Button onClick={onConfirm} disabled={!isValid}>
        {confirmLabel}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Pattern 3: Render Props

```typescript
<DataTable
  data={projects}
  columns={columns}
  renderMobileCard={(project) => (
    <Card>
      <CardHeader>
        <CardTitle>{project.name}</CardTitle>
      </CardHeader>
      <CardContent>{project.description}</CardContent>
    </Card>
  )}
/>
```

---

## 💡 Composition vs Configuration

| Approach | Pros | Cons | Use Case |
|----------|------|------|----------|
| **Configuration** | Simple API, fewer components | Rigid, lots of props | Simple, fixed layouts |
| **Composition** | Flexible, reusable parts | More verbose | Complex, variable layouts |

**Example**:

```typescript
// Configuration (simple, rigid)
<Alert type="success" title="Success" message="Project created" />

// Composition (flexible)
<Alert variant="success">
  <AlertTitle>Success</AlertTitle>
  <AlertDescription>Project created</AlertDescription>
  <AlertActions>
    <Button>Undo</Button>
    <Button>View</Button>
  </AlertActions>
</Alert>
```

**Rule**: Configuration для simple cases, Composition для flexibility.

---

## 🛠️ Практика

1. Відкрий `frontend/src/shared/ui/dialog.tsx`
2. Знайди всі частини: DialogRoot, DialogContent, DialogHeader, etc.
3. Знайди використання Dialog у проекті (CreateAtomDialog)
4. Спробуй змінити порядок: DialogFooter → DialogHeader
5. Створи свій compound component (Accordion, Stepper)

---

## ❓ FAQ

**Q: Composition vs Inheritance?**
A: React **НЕ** використовує inheritance. Тільки composition через children/props.

**Q: Коли використовувати compound components?**
A: Коли частини мають shared state (Tabs, Dialog) і потрібна гнучкість.

**Q: Як передати data між compound components?**
A: Context API (TabsContext у прикладі вище).

---

**Повернутись до:** [Module 03: Component Patterns](index.md)
