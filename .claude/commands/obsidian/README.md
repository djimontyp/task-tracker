# Obsidian Commands

Self-learning system for managing Obsidian vault with automatic pattern analysis and improvement suggestions.

## Architecture

```
Knowledge/              Workspace/
├── Concepts/           ├── Journal/    (daily + sessions)
├── Flows/              ├── Retro/      (weekly reports)
├── Models/             └── Questions/
├── Decisions/
└── Sources/
         │                    │
         └────────┬───────────┘
                  ▼
         .vault-config.json
      (single source of truth)
```

## Workflow

```
Knowledge (atomic, evolving)  ←→  Journal (daily work)
         ↓                              ↓
    Changelog                        Sessions
         ↓                              ↓
    Retro (weekly) ← Pattern Analysis ← Learning
```

## Commands

| Command | Description |
|---------|-------------|
| `/obsidian:create <type> "id"` | Create Knowledge or Question note |
| `/obsidian:vault "<request>"` | Universal query/update interface |
| `/obsidian:journal` | Show today's journal |
| `/obsidian:journal session "name"` | Start work session |
| `/obsidian:journal done` | Close active session |
| `/obsidian:retro [period]` | Weekly report + pattern analysis |
| `/obsidian:sync` | Vault health check + suggestions |
| `/obsidian:sync fix` | Fix issues |
| `/obsidian:search <query>` | Search vault |

### Vault Command

Universal interface for querying and updating vault:

```bash
/obsidian:vault "оновити концепт-моніка: rate limits"  # UPDATE
/obsidian:vault "що знаю про callbacks?"               # ASK
/obsidian:vault "список рішень"                        # LIST
```

## Note Types

### Knowledge (atomic, evolving)

| Type | Prefix | Path |
|------|--------|------|
| concept | concept- | Knowledge/Concepts/ |
| flow | flow- | Knowledge/Flows/ |
| model | model- | Knowledge/Models/ |
| decision | decision- | Knowledge/Decisions/ |
| source | source- | Knowledge/Sources/ |

**Features:**
- Semantic ID (without numbers)
- Status lifecycle: draft → active → stable → archived
- Version + Changelog
- Aliases for search (ukr + eng)

### Workspace (operational)

| Type | Path |
|------|------|
| journal | Workspace/Journal/YYYY/MM/YYYY-MM-DD.md |
| retro | Workspace/Retro/YYYY/MM/week-WW.md |
| question | Workspace/Questions/question-*.md |

## Self-Learning Loop

```
COLLECT → ANALYZE → SUGGEST → ADAPT
   │         │          │        │
   │         │          │        └── /sync accept → changes workflow
   │         │          │
   │         │          └── 💡 Suggestions based on patterns
   │         │
   │         └── /retro → calculates patterns
   │
   └── Each command logs: what, when, how
```

## Patterns Analyzed

- `avg_sessions_per_day` — average sessions per day
- `knowledge_creation_rate` — knowledge notes per day
- `knowledge_update_rate` — update frequency
- `common_prefixes` — frequent prefixes (feat:, fix:, etc.)
- `peak_hours` — peak work hours

## Suggestions

System generates suggestions:

| Type | Example |
|------|---------|
| `workflow` | "Extract Knowledge from Journal findings?" |
| `search` | "Add aliases for better search?" |
| `naming` | "80% sessions use 'feat:'. Make default?" |
| `reminder` | "Monday! Time for retro?" |

## Config

`.obsidian-docs/.vault-config.json` — single source of truth:

```json
{
  "user": { "name": "...", "email": "..." },
  "registry": { "concepts": [], "flows": [], ... },
  "structure": { "knowledge": {...}, "workspace": {...} },
  "templates": { "concept": {...}, "flow": {...}, ... },
  "workflow": { "flow": "...", "sync": {...} },
  "learning": { "patterns": {...}, "history": {...} },
  "suggestions": { "pending": [], "accepted": [], "rejected": [] },
  "state": { "active_session": null, "last_journal": null }
}
```

## Example Workday

```bash
# Morning — start journal
/obsidian:journal
/obsidian:journal session "feat: Review API"

# Work...
# Found insight → create knowledge
/obsidian:create concept "review-validation"

# Done
/obsidian:journal done

# Monday — retro
/obsidian:retro
# → report + patterns + suggestions

# Review suggestions
/obsidian:sync accept sug-001
```

## File Structure

```
.obsidian-docs/
├── .vault-config.json          # config + learning + suggestions
├── Knowledge/
│   ├── Concepts/               # concept-*.md
│   ├── Flows/                  # flow-*.md
│   ├── Models/                 # model-*.md
│   ├── Decisions/              # decision-*.md
│   └── Sources/                # source-*.md
├── Workspace/
│   ├── Journal/YYYY/MM/        # daily work logs
│   ├── Retro/YYYY/MM/          # weekly reports
│   └── Questions/              # question-*.md
└── _templates/                 # note templates

.claude/commands/obsidian/
├── README.md                   # this file
├── create.md                   # /obsidian:create
├── vault.md                    # /obsidian:vault
├── journal.md                  # /obsidian:journal
├── retro.md                    # /obsidian:retro
├── sync.md                     # /obsidian:sync
└── search.md                   # /obsidian:search
```