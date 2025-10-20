import { Badge } from '@/shared/ui'
import { ValidationStatus as Status } from '@/features/providers/types'

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
          className: 'badge-success',
        }
      case Status.ERROR:
        return {
          text: 'Error',
          className: 'badge-error',
        }
      case Status.VALIDATING:
        return {
          text: 'Validating...',
          className: 'badge-info',
        }
      case Status.PENDING:
      default:
        return {
          text: 'Pending',
          className: 'badge-warning',
        }
    }
  }

  const config = getStatusConfig()

  return (
    <Badge variant="outline" className={config.className} title={error}>
      {config.text}
    </Badge>
  )
}

export default ValidationStatus
