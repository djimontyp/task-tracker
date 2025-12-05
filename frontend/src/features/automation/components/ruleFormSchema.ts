import { z } from 'zod'

export const ruleFormSchema = z.object({
  name: z.string().min(1, 'Rule name is required'),
  conditions: z
    .array(
      z.object({
        field: z.string().min(1),
        operator: z.enum(['gte', 'lte', 'eq', 'ne', 'contains', 'starts_with']),
        value: z.union([z.string(), z.number()]),
      })
    )
    .min(1, 'At least one condition is required'),
  logic_operator: z.enum(['AND', 'OR']),
  action: z.enum(['approve', 'reject', 'escalate', 'notify']),
  priority: z.number().min(0).max(100),
  enabled: z.boolean(),
})

export type RuleFormData = z.infer<typeof ruleFormSchema>
