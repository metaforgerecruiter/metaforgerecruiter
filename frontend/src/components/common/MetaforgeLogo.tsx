import React from 'react'

interface MetaforgeLogoProps {
  variant?: 'light' | 'dark' // light = for dark backgrounds (white text), dark = for light backgrounds (navy text)
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function MetaforgeLogo({
  variant = 'light',
  size = 'md',
  className = '',
}: MetaforgeLogoProps) {
  const heightMap = {
    sm: 'h-6 sm:h-7',
    md: 'h-8 sm:h-9',
    lg: 'h-10 sm:h-11',
    xl: 'h-12 sm:h-13',
  }

  return (
    <div className={`inline-flex items-center select-none bg-transparent p-0 m-0 ${className}`}>
      {variant === 'light' ? (
        <img
          src="/metaforge-white-logo.png"
          alt="metaforge logo"
          className={`${heightMap[size]} w-auto object-contain bg-transparent mix-blend-screen`}
        />
      ) : (
        <img
          src="/metaforge-logo.png"
          alt="metaforge logo"
          className={`${heightMap[size]} w-auto object-contain bg-transparent`}
        />
      )}
    </div>
  )
}
