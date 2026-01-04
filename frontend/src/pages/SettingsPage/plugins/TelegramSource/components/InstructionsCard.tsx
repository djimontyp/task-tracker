import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Bot, MessageSquare, CheckCircle, Users, type LucideIcon } from 'lucide-react'

interface Instruction {
  icon: LucideIcon
  titleKey: string
  descriptionKey: string
}

const INSTRUCTIONS: Instruction[] = [
  {
    icon: Bot,
    titleKey: 'telegram.wizard.instructions.addBot.title',
    descriptionKey: 'telegram.wizard.instructions.addBot.description',
  },
  {
    icon: Users,
    titleKey: 'telegram.wizard.instructions.grantPermissions.title',
    descriptionKey: 'telegram.wizard.instructions.grantPermissions.description',
  },
  {
    icon: MessageSquare,
    titleKey: 'telegram.wizard.instructions.configureWebhook.title',
    descriptionKey: 'telegram.wizard.instructions.configureWebhook.description',
  },
  {
    icon: CheckCircle,
    titleKey: 'telegram.wizard.instructions.testConnection.title',
    descriptionKey: 'telegram.wizard.instructions.testConnection.description',
  },
]

export function InstructionsCard() {
  const { t } = useTranslation('settings')

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">{t('telegram.wizard.instructions.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-4">
          {INSTRUCTIONS.map((step, index) => (
            <li key={step.titleKey} className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">{index + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium flex items-center gap-2 text-sm">
                  <step.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  {t(step.titleKey)}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">{t(step.descriptionKey)}</p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}

export default InstructionsCard
