'use client'

import { useEffect, useRef } from 'react'
import { useStickySlider } from '@/hooks/useStickySlider'

/**
 * Component tự động áp dụng sticky cho tất cả slider trong children
 * Sử dụng để wrap bất kỳ component nào có slider
 */
export default function AutoStickySlider({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Tìm tất cả range input trong container
    const rangeInputs = containerRef.current.querySelectorAll('input[type="range"]')
    
    rangeInputs.forEach((input) => {
      // Tìm parent container gần nhất
      let parent = input.parentElement
      while (parent && parent !== containerRef.current) {
        // Kiểm tra nếu parent đã có sticky wrapper
        if (parent.classList.contains('sticky-slider-wrapper')) {
          return
        }
        parent = parent.parentElement
      }

      // Tạo wrapper nếu chưa có
      if (input.parentElement && !input.parentElement.classList.contains('sticky-slider-wrapper')) {
        const wrapper = document.createElement('div')
        wrapper.className = 'sticky-slider-wrapper'
        input.parentElement.insertBefore(wrapper, input)
        wrapper.appendChild(input)
      }
    })
  }, [children])

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}

