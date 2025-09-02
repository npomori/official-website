import React from 'react'

interface ImageTextLayoutProps {
  imageSrc: string
  imageAlt: string
  title?: string
  children: React.ReactNode
  imagePosition?: 'left' | 'right'
  className?: string
}

const ImageTextLayout: React.FC<ImageTextLayoutProps> = ({
  imageSrc,
  imageAlt,
  title,
  children,
  imagePosition = 'left',
  className = ''
}) => {
  const imageClasses = 'w-full h-64 md:h-80 object-cover rounded-lg shadow-md'
  const textClasses = 'flex flex-col justify-center'

  return (
    <div className={`my-2 ${className}`}>
      <div
        className={`grid grid-cols-1 items-center gap-6 md:grid-cols-2 ${
          imagePosition === 'right' ? 'md:grid-flow-col-dense' : ''
        }`}
      >
        {imagePosition === 'left' ? (
          <>
            <div className="order-1 md:order-1">
              <img src={imageSrc} alt={imageAlt} className={imageClasses} />
            </div>
            <div className={`order-2 md:order-2 ${textClasses}`}>
              {title && <h3 className="mb-3 text-xl font-bold text-gray-900">{title}</h3>}
              <div className="leading-relaxed text-gray-700">{children}</div>
            </div>
          </>
        ) : (
          <>
            <div className={`order-2 md:order-1 ${textClasses}`}>
              {title && <h3 className="mb-3 text-xl font-bold text-gray-900">{title}</h3>}
              <div className="leading-relaxed text-gray-700">{children}</div>
            </div>
            <div className="order-1 md:order-2">
              <img src={imageSrc} alt={imageAlt} className={imageClasses} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ImageTextLayout
