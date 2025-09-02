import React from 'react'

interface InfoCardProps {
  title: string
  description: string
  icon?: string
  color?: 'blue' | 'green' | 'purple' | 'orange'
  className?: string
}

const InfoCard: React.FC<InfoCardProps> = ({
  title,
  description,
  icon,
  color = 'blue',
  className = ''
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800'
  }

  return (
    <div className={`rounded-lg border-2 p-6 ${colorClasses[color]} ${className}`}>
      <h3 className="mb-3 text-xl font-bold">
        {icon && <span className="mr-2">{icon}</span>}
        {title}
      </h3>
      <p className="leading-relaxed">{description}</p>
    </div>
  )
}

export default InfoCard
