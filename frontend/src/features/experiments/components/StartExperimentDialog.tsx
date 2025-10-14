/**
 * StartExperimentDialog Component
 */

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  Slider,
} from '@/shared/ui'
import { providerService } from '@/features/providers/api'
import type { LLMProvider } from '@/features/providers/types'
import type { ExperimentCreate } from '../types'

interface StartExperimentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ExperimentCreate) => void
  isLoading?: boolean
}

const StartExperimentDialog = ({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: StartExperimentDialogProps) => {
  const [providerId, setProviderId] = useState<string>('')
  const [modelName, setModelName] = useState<string>('')
  const [messageCount, setMessageCount] = useState<number>(20)

  const { data: providers } = useQuery<LLMProvider[]>({
    queryKey: ['providers'],
    queryFn: () => providerService.listProviders(),
    enabled: open,
  })

  const activeProviders = providers?.filter((p) => p.is_active) ?? []

  useEffect(() => {
    if (activeProviders.length > 0 && !providerId) {
      setProviderId(activeProviders[0].id)
    }
  }, [activeProviders, providerId])

  const handleSubmit = () => {
    if (!providerId || !modelName || messageCount < 1) return

    onSubmit({
      provider_id: providerId,
      model_name: modelName,
      message_count: messageCount,
    })
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isLoading) {
      setProviderId('')
      setModelName('')
      setMessageCount(20)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start Classification Experiment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Select value={providerId} onValueChange={setProviderId} disabled={isLoading}>
              <SelectTrigger id="provider">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {activeProviders.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No active providers
                  </SelectItem>
                ) : (
                  activeProviders.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name} ({provider.type})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Model Name</Label>
            <Input
              id="model"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="qwen2.5:7b, gpt-4o-mini"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Examples: qwen2.5:7b, gpt-4o-mini, llama3:8b
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="messages">Message Count</Label>
              <span className="text-sm font-medium">{messageCount}</span>
            </div>
            <Slider
              id="messages"
              min={1}
              max={100}
              step={1}
              value={[messageCount]}
              onValueChange={(values) => setMessageCount(values[0])}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              How many random messages to use for testing (1-100)
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!providerId || !modelName || messageCount < 1 || isLoading}
          >
            {isLoading ? 'Starting...' : 'Start'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default StartExperimentDialog
