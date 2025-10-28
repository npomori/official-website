import { Icon } from '@iconify/react'

interface AlertProps {
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
}

const Alert: React.FC<AlertProps> = ({ message, type = 'info' }) => {
  const alertStyles = {
    success: 'bg-success-50 text-success-800',
    error: 'bg-error-50 text-error-800',
    warning: 'bg-warning-50 text-warning-800',
    info: 'bg-info-50 text-info-800'
  }

  const alertIcons = {
    success: 'mdi:check-circle',
    error: 'mdi:alert-circle',
    warning: 'mdi:alert',
    info: 'mdi:information'
  }

  const alertRoles = {
    success: 'status',
    error: 'alert',
    warning: 'alert',
    info: 'status'
  }

  // \n を改行に変換
  const formattedMessage = message.split('\\n').map((line, index, array) => (
    <span key={index}>
      {line}
      {index < array.length - 1 && <br />}
    </span>
  ))

  return (
    <div
      className={`mb-4 flex items-center rounded-lg p-4 text-base ${alertStyles[type]}`}
      role={alertRoles[type]}
    >
      <Icon className="mr-1 h-8 w-8" icon={alertIcons[type]} />
      <span className="sr-only">{type}</span>
      <div>{formattedMessage}</div>
    </div>
  )
}
export default Alert
