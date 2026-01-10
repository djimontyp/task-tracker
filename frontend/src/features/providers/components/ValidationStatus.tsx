import { Badge } from '@/shared/ui'
import { ValidationStatus as Status } from '@/features/providers/types'
import { CheckCircle, XCircle, Loader2, Clock } from 'lucide-react'

export interface ValidationStatusProps {
  status: Status
  error?: string
}

const ValidationStatus = ({ status, error }: ValidationStatusProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case Status.CONNECTED:
        return {
          text: 'Connected',
          className: 'bg-semantic-success text-white border-semantic-success',
          Icon: CheckCircle,
        }
      case Status.ERROR:
        return {
          text: 'Error',
          className: 'bg-semantic-error text-white border-semantic-error',
          Icon: XCircle,
        }
      case Status.VALIDATING:
        return {
          text: 'Validating...',
          className: 'bg-semantic-info text-white border-semantic-info',
          Icon: Loader2,
          animated: true,
        }
      case Status.PENDING:
      default:
        return {
          text: 'Pending',
          className: 'bg-semantic-warning text-white border-semantic-warning',
          Icon: Clock,
        }
    }
  }

  const config = getStatusConfig()
  const IconComponent = config.Icon

  return (
    <Badge variant="outline" className={config.className} title={error}>
      <IconComponent className={`h-4 w-4 mr-2 ${config.animated ? 'animate-spin' : ''}`} />
      {config.text}
    </Badge>
  )
}

export { ValidationStatus }
