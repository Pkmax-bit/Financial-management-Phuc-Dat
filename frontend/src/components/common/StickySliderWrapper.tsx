'use client'

import { ReactNode } from 'react'
import { useStickySlider } from '@/hooks/useStickySlider'

interface StickySliderWrapperProps {
  children: ReactNode
  className?: string
  offset?: number
  enabled?: boolean
}

export default function StickySliderWrapper({
  children,
  className = '',
  offset = 20,
  enabled = true,
}: StickySliderWrapperProps) {
  const { sliderRef, isSticky, stickyStyle, stickyClassName } = useStickySlider({
    offset,
    enabled,
  })

  return (
    <div
      ref={sliderRef}
      className={`${stickyClassName} ${className}`}
      style={stickyStyle}
    >
      {children}
    </div>
  )
}

