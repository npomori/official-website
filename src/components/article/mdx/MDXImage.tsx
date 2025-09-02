import React from 'react'

interface MDXImageProps {
  src: string
  alt: string
  size?: 'small' | 'medium' | 'large' | 'full'
  align?: 'left' | 'center' | 'right'
  caption?: string
  className?: string
  rounded?: boolean
  shadow?: boolean
}

const MDXImage: React.FC<MDXImageProps> = ({
  src,
  alt,
  size = 'medium',
  align = 'center',
  caption,
  className = '',
  rounded = true,
  shadow = true
}) => {
  const sizeClasses = {
    small: 'max-w-sm',
    medium: 'max-w-2xl',
    large: 'max-w-4xl',
    full: 'w-full'
  }

  const alignClasses = {
    left: 'mr-6 float-left',
    center: 'mx-auto',
    right: 'ml-6 float-right'
  }

  const imageClasses = [
    sizeClasses[size],
    alignClasses[align],
    'w-full h-auto',
    rounded ? 'rounded-lg' : '',
    shadow ? 'shadow-md' : '',
    className
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={`my-6 ${align === 'center' ? 'text-center' : ''}`}>
      <img src={src} alt={alt} className={imageClasses} />
      {caption && <p className="mt-2 text-center text-sm text-gray-600 italic">{caption}</p>}
    </div>
  )
}

export default MDXImage
