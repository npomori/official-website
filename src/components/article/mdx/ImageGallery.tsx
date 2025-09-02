import React from 'react'

interface ImageItem {
  src: string
  alt: string
  caption?: string
}

interface ImageGalleryProps {
  images: ImageItem[]
  columns?: 1 | 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  columns = 2,
  gap = 'md',
  className = ''
}) => {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  }

  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-6',
    lg: 'gap-8'
  }

  return (
    <div className={`my-2 ${className}`}>
      <div className={`grid ${columnClasses[columns]} ${gapClasses[gap]}`}>
        {images.map((image, index) => (
          <div key={index}>
            <img
              src={image.src}
              alt={image.alt}
              className="h-48 w-full rounded-lg object-cover shadow-md md:h-64"
            />
            {image.caption && (
              <p className="mt-2 text-center text-sm text-gray-600">{image.caption}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ImageGallery
