# Generate Story for Component

Generate a Storybook story file for a specified component.

## Arguments

- `$ARGUMENTS` - Component path relative to frontend/src (e.g., `shared/ui/button.tsx`)

## Task

1. **Read the component** to understand its:
   - Props interface
   - Variants (if any)
   - Use cases

2. **Determine tier and template**:
   - `shared/ui/` → Tier 1, use `shared-ui.template.tsx`
   - `shared/patterns/` → Tier 2, use `pattern.template.tsx`
   - `shared/components/` → Tier 2, use `pattern.template.tsx`
   - `features/*/` → Tier 3, use `feature.template.tsx`

3. **Generate story file** with:
   - Proper title path (UI/, Design System/Patterns/, etc.)
   - `tags: ['autodocs']`
   - All required stories for the tier
   - Proper argTypes for controls

4. **Verify** the story compiles:
   ```bash
   cd frontend && npx tsc --noEmit
   ```

## Templates Location

`.claude/skills/storybook/templates/`

## Example

Input: `shared/ui/badge.tsx`

Output: Create `shared/ui/badge.stories.tsx` with:
- Title: `UI/Badge`
- Stories: Default, Variants (destructive, outline, secondary), Sizes
- argTypes for variant and size controls

## Requirements

- Always include `tags: ['autodocs']`
- Follow naming convention from skill
- Minimum stories based on tier
- Test that story compiles before completing
