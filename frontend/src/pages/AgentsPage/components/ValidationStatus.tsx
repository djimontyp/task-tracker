import { Badge } from '@shared/ui'
import { ValidationStatus as Status } from '@/types/provider'

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
          className: 'bg-green-500/10 text-green-700 border-green-500/20 hover:bg-green-500/20',
        }
      case Status.ERROR:
        return {
          text: 'Error',
          className: 'bg-red-500/10 text-red-700 border-red-500/20 hover:bg-red-500/20',
        }
      case Status.VALIDATING:
        return {
          text: 'Validating...',
          className: 'bg-blue-500/10 text-blue-700 border-blue-500/20 hover:bg-blue-500/20',
        }
      case Status.PENDING:
      default:
        return {
          text: 'Pending',
          className: 'bg-gray-500/10 text-gray-700 border-gray-500/20 hover:bg-gray-500/20',
        }
    }
  }

  const config = getStatusConfig()

  return (
    <Badge className={config.className} title={error}>
      {config.text}
    </Badge>
  )
}

export default ValidationStatus
