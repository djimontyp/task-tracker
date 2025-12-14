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
  const handleInputChange = (value: string) => {
    onNewChannelIdChange(value)
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Channels ({channels.length})</h3>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRefreshNames}
          disabled={isRefreshingNames || channels.length === 0}
          aria-label="Refresh Telegram channel names"
        >
          <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshingNames && 'animate-spin')} />
          {isRefreshingNames ? 'Refreshing…' : 'Refresh Names'}
        </Button>
      </div>

      {/* Add Channel Form */}
      <FormField
        label="Add Channel"
        id="new-channel-id"
        error={
          inputValidation === 'invalid'
            ? 'Invalid format. Paste a Telegram group link or enter -100XXXXXXXXX'
            : undefined
        }
      >
        <div className="flex gap-2">
          <Input
            id="new-channel-id"
            placeholder="Paste group URL or enter -100XXXXXXXXX"
            value={newChannelId}
            onChange={(e) => handleInputChange(e.target.value)}
            autoComplete="off"
            aria-label="Enter Telegram channel ID or URL"
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
            aria-label="Add Telegram channel to monitoring list"
            className="shrink-0 self-start"
          >
            {isAddingChannel ? 'Adding…' : 'Add'}
          </Button>
        </div>
        {inputValidation === 'valid' && (
          <p className="text-xs text-semantic-success mt-2 flex items-center gap-2">
            <Check className="h-3 w-3" />
            Valid channel ID
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
                      <Badge variant="outline" className="text-xs shrink-0">Name Pending</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    ID: {channel.id}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveChannel(channel.id)}
                  disabled={removingChannelIds.has(channel.id)}
                  className="text-destructive hover:text-destructive/90 hover:bg-destructive/10 shrink-0"
                  aria-label={`Remove ${channel.name || 'channel'} from monitoring list`}
                >
                  {removingChannelIds.has(channel.id) ? (
                    'Removing…'
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Remove
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ))}
          {channels.some(c => !c.name) && (
            <p className="text-xs text-muted-foreground">
              Tip: Add bot as admin to the channel, then click &quot;Refresh Names&quot; to load names
            </p>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
          </div>
          <h4 className="text-sm font-medium text-foreground mb-2">No channels yet</h4>
          <p className="text-xs text-muted-foreground max-w-xs">
            Paste a Telegram group URL or enter a channel ID to start monitoring messages from that channel.
          </p>
        </div>
      )}
    </div>
  )
}

export default ChannelList
