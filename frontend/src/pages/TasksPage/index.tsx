import { useNavigate } from 'react-router-dom'
import { Card, Button } from '@/shared/ui'
import { CheckCircleIcon, PlayIcon } from '@heroicons/react/24/outline'
import { PageHeader } from '@/shared/components'

const TasksPage = () => {
  const navigate = useNavigate()

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      <PageHeader
        title="Tasks"
        description="AI-generated actionable tasks extracted from analyzed messages"
      />

      <Card className="p-12 border-dashed border-2">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircleIcon className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Tasks Yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Tasks are automatically created from AI analysis runs. Run your first analysis to generate actionable tasks from your messages.
          </p>
          <div className="flex gap-3 flex-wrap justify-center">
            <Button onClick={() => navigate('/analysis')} size="lg">
              <PlayIcon className="mr-2 h-5 w-5" />
              Run Analysis
            </Button>
            <Button onClick={() => navigate('/messages')} variant="outline" size="lg">
              View Messages
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default TasksPage
