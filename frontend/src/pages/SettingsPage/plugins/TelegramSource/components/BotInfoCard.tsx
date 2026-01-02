import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Bot, Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { BOT_USERNAME, BOT_NAME } from '../types'

export function BotInfoCard() {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const handleCopyUsername = async () => {
    try {
      await navigator.clipboard.writeText(BOT_USERNAME)
      setCopied(true)
      toast.success(t('toast.success.copied', { text: t('toast.entities.botUsername') }))
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(t('toast.error.copyFailed'))
    }
  }

  return (
    <Card className="p-4 bg-muted/30 border-dashed">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Bot className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{BOT_NAME}</p>
          <p className="text-sm text-muted-foreground">{BOT_USERNAME}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 flex-shrink-0"
          onClick={handleCopyUsername}
          aria-label={copied ? 'Username copied' : 'Copy bot username'}
        >
          {copied ? (
            <Check className="h-4 w-4 text-semantic-success" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </Card>
  )
}

export default BotInfoCard
