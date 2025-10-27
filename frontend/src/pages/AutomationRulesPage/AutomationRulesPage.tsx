import { useState } from 'react'
import { Button } from '@/shared/ui/button'
import { RuleTemplatesLibrary } from '@/features/automation/components/RuleTemplatesLibrary'
import { RuleBuilderForm } from '@/features/automation/components/RuleBuilderForm'
import { RuleLivePreview } from '@/features/automation/components/RuleLivePreview'
import { RulePerformanceTable } from '@/features/automation/components/RulePerformanceTable'
import type { AutomationRule, RuleTemplate, RuleCondition } from '@/features/automation/types'

export default function AutomationRulesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<RuleTemplate | undefined>()
  const [editingRule, setEditingRule] = useState<AutomationRule | undefined>()
  const [showForm, setShowForm] = useState(false)
  const [previewConditions, setPreviewConditions] = useState<RuleCondition[]>([])
  const [previewAction, setPreviewAction] = useState<'approve' | 'reject' | 'escalate' | 'notify'>(
    'approve'
  )

  const handleSelectTemplate = (template: RuleTemplate) => {
    setSelectedTemplate(template)
    setEditingRule(undefined)
    setShowForm(true)
    setPreviewConditions(template.conditions)
    setPreviewAction(template.action)
  }

  const handleEditRule = (rule: AutomationRule) => {
    setEditingRule(rule)
    setSelectedTemplate(undefined)
    setShowForm(true)
    setPreviewConditions(rule.conditions)
    setPreviewAction(rule.action)
  }

  const handleCreateNew = () => {
    setSelectedTemplate(undefined)
    setEditingRule(undefined)
    setShowForm(true)
    setPreviewConditions([])
    setPreviewAction('approve')
  }

  const handleSuccess = () => {
    setShowForm(false)
    setSelectedTemplate(undefined)
    setEditingRule(undefined)
    setPreviewConditions([])
  }

  const handleCancel = () => {
    setShowForm(false)
    setSelectedTemplate(undefined)
    setEditingRule(undefined)
    setPreviewConditions([])
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Automation Rules</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage automation rules for knowledge approval
          </p>
        </div>
        {!showForm && (
          <Button onClick={handleCreateNew}>Create New Rule</Button>
        )}
      </div>

      {showForm ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-3">
            <RuleTemplatesLibrary onSelectTemplate={handleSelectTemplate} />
          </aside>

          <main className="lg:col-span-6">
            <RuleBuilderForm
              rule={editingRule}
              template={selectedTemplate}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </main>

          <aside className="lg:col-span-3">
            <RuleLivePreview
              conditions={previewConditions}
              action={previewAction}
              logicOperator="AND"
            />
          </aside>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-4">Active Rules</h2>
            <RulePerformanceTable onEdit={handleEditRule} />
          </div>
        </div>
      )}
    </div>
  )
}
