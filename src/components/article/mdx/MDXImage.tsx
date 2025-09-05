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
    small: 'w-48',
    medium: 'w-64',
    large: 'w-80',
    full: 'w-full max-w-2xl'
  }

  // CSS クラスベースでのレイアウト制御
  const getContainerClasses = () => {
    const baseClasses = ['mdx-image-container']

    if (align === 'left') {
      baseClasses.push('mdx-image-float-left')
    } else if (align === 'right') {
      baseClasses.push('mdx-image-float-right')
    } else {
      baseClasses.push('text-center')
    }

    return baseClasses.join(' ')
  }

  const getImageClasses = () => {
    const classes = [
      sizeClasses[size],
      'h-auto',
      rounded ? 'rounded-lg' : '',
      shadow ? 'shadow-md' : '',
      className
    ].filter(Boolean)

    // 中央配置の場合のみmx-autoを追加
    if (align === 'center') {
      classes.push('mx-auto')
    }

    return classes.join(' ')
  }

  const getCaptionClasses = () => {
    const baseClasses = 'mt-2 text-sm text-gray-600 italic'
    return align === 'center' ? `${baseClasses} text-center` : baseClasses
  }

  return (
    <div className={getContainerClasses()}>
      <img src={src} alt={alt} className={getImageClasses()} />
      {caption && <p className={getCaptionClasses()}>{caption}</p>}
    </div>
  )
}

export default MDXImage
