import React, { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
}

const Card = ({ children, className = '', padding = 'md', hover = false }: CardProps) => {
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4 md:p-6',
    lg: 'p-6 md:p-8',
  }

  const hoverStyle = hover ? 'hover:shadow-lg transition-shadow duration-200' : ''

  return (
    <div className={`bg-white rounded-lg shadow-md ${paddingStyles[padding]} ${hoverStyle} ${className}`}>
      {children}
    </div>
  )
}

export default Card