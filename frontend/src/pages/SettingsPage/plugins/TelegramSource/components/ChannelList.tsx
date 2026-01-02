import { useTranslation } from 'react-i18next'
import { Card } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Input } from '@/shared/ui/input'
import { FormField } from '@/shared/patterns'
import { MessageSquare, X, RefreshCw, Check, Users } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

export interface ChannelInfo {
  id: number
  name?: string | null
}

interface ChannelListProps {
  channels: ChannelInfo[]
  newChannelId: string
  onNewChannelIdChange: (value: string) => void
  inputValidation: 'valid' | 'invalid' | null
  isAddingChannel: boolean
  isRefreshingNames: boolean
  removingChannelIds: Set<number>
  onAddChannel: () => void
  onRemoveChannel: (id: number) => void
  onRefreshNames: () => void
}

export function ChannelList({
  channels,
  newChannelId,
  onNewChannelIdChange,
  inputValidation,
  isAddingChannel,
  isRefreshingNames,
  removingChannelIds,
  onAddChannel,
  onRemoveChannel,
  onRefreshNames,
}: ChannelListProps) {
  const { t } = useTranslation('settings')

  const handleInputChange = (value: string) => {
    onNewChannelIdChange(value)
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">{t('telegram.channels.title', { count: channels.length })}</h3>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRefreshNames}
          disabled={isRefreshingNames || channels.length === 0}
          aria-label={t('telegram.channels.refreshNames')}
        >
          <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshingNames && 'animate-spin')} />
          {isRefreshingNames ? t('telegram.channels.refreshing') : t('telegram.channels.refreshNames')}
        </Button>
      </div>

      {/* Add Channel Form */}
      <FormField
        label={t('telegram.channels.addChannel')}
        id="new-channel-id"
        error={
          inputValidation === 'invalid'
            ? t('telegram.channels.invalidFormat')
            : undefined
        }
      >
        <div className="flex gap-2">
          <Input
            id="new-channel-id"
            placeholder={t('telegram.channels.addPlaceholder')}
            value={newChannelId}
            onChange={(e) => handleInputChange(e.target.value)}
            autoComplete="off"
            aria-label={t('telegram.channels.addChannel')}
            className={cn(
              'flex-1',
              inputValidation === 'valid' && 'border-semantic-success focus-visible:ring-semantic-success',
              inputValidation === 'invalid' && 'border-semantic-error focus-visible:ring-semantic-error'
            )}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && inputValidation === 'valid') {
                onAddChannel()
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddChannel}
            disabled={isAddingChannel || !newChannelId.trim() || inputValidation === 'invalid'}
            aria-label={t('telegram.channels.addChannel')}
            className="shrink-0 self-start"
          >
            {isAddingChannel ? t('telegram.channels.adding') : t('telegram.channels.addButton')}
          </Button>
        </div>
        {inputValidation === 'valid' && (
          <p className="text-xs text-semantic-success mt-2 flex items-center gap-2">
            <Check className="h-3 w-3" />
            {t('telegram.channels.validId')}
          </p>
        )}
      </FormField>

      {/* Channel List */}
      {channels.length > 0 ? (
        <div className="space-y-4">
          {channels.map(channel => (
            <Card key={channel.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-foreground break-words">
                      {channel.name || `Channel ${channel.id}`}
                    </p>
                    {!channel.name && (
                      <Badge variant="outline" className="text-xs shrink-0">{t('telegram.channels.namePending')}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    {t('telegram.actions.idLabel')} {channel.id}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveChannel(channel.id)}
                  disabled={removingChannelIds.has(channel.id)}
                  className="text-destructive hover:text-destructive/90 hover:bg-destructive/10 shrink-0"
                  aria-label={t('telegram.channels.remove')}
                >
                  {removingChannelIds.has(channel.id) ? (
                    t('telegram.channels.removing')
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      {t('telegram.channels.remove')}
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ))}
          {channels.some(c => !c.name) && (
            <p className="text-xs text-muted-foreground">
              {t('telegram.channels.refreshTip')}
            </p>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
          </div>
          <h4 className="text-sm font-medium text-foreground mb-2">{t('telegram.channels.noChannels')}</h4>
          <p className="text-xs text-muted-foreground max-w-xs">
            {t('telegram.channels.noChannelsDescription')}
          </p>
        </div>
      )}
    </div>
  )
}

export default ChannelList
