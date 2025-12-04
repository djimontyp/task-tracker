import { Badge } from '@/shared/ui'
import { ValidationStatus as Status } from '@/features/providers/types'
import { CheckCircle, XCircle, Loader2, Clock } from 'lucide-react'

interface ValidationStatusProps {
  status: Status
  error?: string
}

const ValidationStatus = ({ status, error }: ValidationStatusProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case Status.CONNECTED:
        return {
          text: 'Connected',
          className: 'bg-emerald-500 text-white border-emerald-600',
          Icon: CheckCircle,
        }
      case Status.ERROR:
        return {
          text: 'Error',
          className: 'bg-rose-500 text-white border-rose-600',
          Icon: XCircle,
        }
      case Status.VALIDATING:
        return {
          text: 'Validating...',
          className: 'bg-blue-500 text-white border-blue-600',
          Icon: Loader2,
          animated: true,
        }
      case Status.PENDING:
      default:
        return {
          text: 'Pending',
          className: 'bg-amber-500 text-white border-amber-600',
          Icon: Clock,
        }
    }
  }

  const config = getStatusConfig()
  const IconComponent = config.Icon

  return (
    <Badge variant="outline" className={config.className} title={error}>
      <IconComponent className={`h-4 w-4 mr-1 ${config.animated ? 'animate-spin' : ''}`} />
      {config.text}
    </Badge>
  )
}

export default ValidationStatus
