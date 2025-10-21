import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, ColorPickerPopover } from '@/shared/components'
import { Spinner, Button } from '@/shared/ui'
import { topicService } from '@/features/topics/api/topicService'
import type { TopicListResponse } from '@/features/topics/types'
import { renderTopicIcon } from '@/features/topics/utils/renderIcon'
import { FolderIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'

const TopicsPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: topics, isLoading, error } = useQuery<TopicListResponse>({
    queryKey: ['topics'],
    queryFn: () => topicService.listTopics(),
  })

  const updateColorMutation = useMutation({
    mutationFn: ({ topicId, color }: { topicId: number; color: string }) =>
      topicService.updateTopicColor(topicId, color),
    onMutate: async ({ topicId, color }) => {
      await queryClient.cancelQueries({ queryKey: ['topics'] })

      const previousTopics = queryClient.getQueryData<TopicListResponse>(['topics'])

      queryClient.setQueryData<TopicListResponse>(['topics'], (old) => {
        if (!old) return old
        return {
          ...old,
          items: old.items.map((topic) =>
            topic.id === topicId ? { ...topic, color } : topic
          ),
        }
      })

      return { previousTopics }
    },
    onSuccess: (updatedTopic, { topicId }) => {
      queryClient.setQueryData<TopicListResponse>(['topics'], (old) => {
        if (!old) return old
        return {
          ...old,
          items: old.items.map((topic) =>
            topic.id === topicId ? updatedTopic : topic
          ),
        }
      })
    },
    onError: (err, variables, context) => {
      if (context?.previousTopics) {
        queryClient.setQueryData(['topics'], context.previousTopics)
      }
    },
  })

  const handleColorChange = (topicId: number, color: string) => {
    updateColorMutation.mutate({ topicId, color })
  }

  const handleAutoPickColor = async (topicId: number) => {
    try {
      const result = await topicService.suggestColor(topicId)
      updateColorMutation.mutate({ topicId, color: result.suggested_color })
    } catch (error) {
      console.error('Failed to suggest color:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Topics</h1>
        <Card className="p-6 border-destructive">
          <div className="flex items-start gap-3">
            <div className="text-destructive text-lg">⚠️</div>
            <div>
              <p className="font-semibold text-destructive mb-1">Error loading data</p>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Topics</h1>
        <p className="text-muted-foreground">
          Manage classification topics for task organization
        </p>
      </div>

      {topics && topics.items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.items.map((topic) => (
            <Card
              key={topic.id}
              className="p-6 transition-all duration-200 hover:shadow-lg hover:scale-[1.01] cursor-pointer"
              onClick={() => navigate(`/topics/${topic.id}`)}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="text-primary flex-shrink-0">
                  {renderTopicIcon(topic.icon, 'h-5 w-5', topic.color)}
                </div>
                <h3 className="text-lg font-semibold flex-1">{topic.name}</h3>
                <div onClick={(e) => e.stopPropagation()}>
                  <ColorPickerPopover
                    color={topic.color || '#64748B'}
                    onColorChange={(color) => handleColorChange(topic.id, color)}
                    onAutoPickClick={() => handleAutoPickColor(topic.id)}
                    disabled={updateColorMutation.isPending}
                  />
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">{topic.description}</p>

              <div className="text-xs text-muted-foreground">
                ID: {topic.id} | Created: {new Date(topic.created_at).toLocaleDateString()}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 border-dashed border-2">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <FolderIcon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Topics Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Topics help organize messages by theme. They are automatically created during AI analysis of your messages.
            </p>
            <div className="flex gap-3 flex-wrap justify-center">
              <Button onClick={() => navigate('/messages')}>
                <ChatBubbleLeftRightIcon className="mr-2 h-5 w-5" />
                View Messages
              </Button>
              <Button onClick={() => navigate('/analysis')} variant="outline">
                Run Analysis
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default TopicsPage