# State Management Reference

## TanStack Query (Server State)

### Basic Query
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['atoms', topicId],
  queryFn: () => atomService.getByTopic(topicId),
  staleTime: 5 * 60 * 1000,  // 5 min
});
```

### Mutation with Invalidation
```typescript
const createMutation = useMutation({
  mutationFn: atomService.create,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['atoms'] });
    toast.success('Atom created');
  },
  onError: (error) => {
    toast.error(error.message);
  }
});
```

### Optimistic Updates
```typescript
const updateMutation = useMutation({
  mutationFn: atomService.update,
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: ['atom', id] });
    const previous = queryClient.getQueryData(['atom', id]);
    queryClient.setQueryData(['atom', id], newData);
    return { previous };
  },
  onError: (err, newData, context) => {
    queryClient.setQueryData(['atom', id], context.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['atom', id] });
  }
});
```

## Zustand (Client State)

### UI Store
```typescript
// frontend/src/shared/store/uiStore.ts
interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  isAdminMode: boolean;

  toggleSidebar: () => void;
  setTheme: (theme: Theme) => void;
  toggleAdminMode: () => void;
}

const useUiStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'system',
      isAdminMode: false,

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
      toggleAdminMode: () => set((s) => ({ isAdminMode: !s.isAdminMode })),
    }),
    { name: 'ui-settings' }
  )
);
```

### Messages Store (Feature-specific)
```typescript
// frontend/src/features/messages/store/messagesStore.ts
interface MessagesState {
  messages: Message[];
  statusByExternalId: Map<string, string>;

  upsertMessage: (msg: Message) => void;
  clear: () => void;
}

// With devtools, NOT persisted
const useMessagesStore = create<MessagesState>()(
  devtools((set) => ({
    messages: [],
    statusByExternalId: new Map(),

    upsertMessage: (msg) => set((s) => ({
      messages: [...s.messages.filter(m => m.id !== msg.id), msg]
    })),
    clear: () => set({ messages: [], statusByExternalId: new Map() })
  }))
);
```

## Anti-Patterns

```typescript
// ❌ WRONG: Server data in Zustand
const setAtoms = useStore(s => s.setAtoms);
useEffect(() => { fetchAtoms().then(setAtoms); }, []);

// ✅ RIGHT: TanStack Query
const { data: atoms } = useQuery({
  queryKey: ['atoms'],
  queryFn: atomService.list
});
```