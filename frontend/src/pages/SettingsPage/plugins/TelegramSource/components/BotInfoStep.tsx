import { useTranslation } from 'react-i18next'
import { BotInfoCard } from './BotInfoCard'
import { InstructionsCard } from './InstructionsCard'

export function BotInfoStep() {
  const { t } = useTranslation('settings')

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">
          {t('telegram.wizard.welcome.title')}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t('telegram.wizard.welcome.description')}
        </p>
      </div>

      <BotInfoCard />
      <InstructionsCard />
    </div>
  )
}

export default BotInfoStep
