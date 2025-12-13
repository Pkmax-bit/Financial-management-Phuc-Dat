'use client'

import { useEffect } from 'react'
import { useStickySlider } from '@/hooks/useStickySlider'

/**
 * Provider component để tự động áp dụng sticky cho tất cả slider trong ứng dụng
 * Thêm component này vào root layout để tự động hoạt động
 */
export default function StickySliderProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Function để apply sticky cho một slider element
    const applyStickyToSlider = (sliderElement: HTMLInputElement) => {
      // Bỏ qua nếu đã được xử lý
      if (sliderElement.dataset.stickyApplied === 'true') {
        return
      }

      // Tìm parent container
      let container = sliderElement.closest(
        '.overflow-y-auto, .overflow-auto, [class*="scroll"], [class*="overflow"]'
      ) as HTMLElement

      if (!container) {
        container = document.body
      }

      // Tạo wrapper nếu chưa có
      let wrapper = sliderElement.parentElement
      if (!wrapper || !wrapper.classList.contains('sticky-slider-wrapper')) {
        wrapper = document.createElement('div')
        wrapper.className = 'sticky-slider-wrapper'
        sliderElement.parentElement?.insertBefore(wrapper, sliderElement)
        wrapper.appendChild(sliderElement)
      }

      // Apply sticky logic
      let isSticky = false
      const offset = 20

      const handleScroll = () => {
        const sliderRect = sliderElement.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()

        const shouldSticky =
          sliderRect.top < containerRect.top + offset &&
          sliderRect.bottom > containerRect.top

        if (shouldSticky !== isSticky) {
          isSticky = shouldSticky
          if (isSticky) {
            wrapper.classList.add('sticky-active')
            wrapper.style.top = `${containerRect.top + offset}px`
          } else {
            wrapper.classList.remove('sticky-active')
            wrapper.style.top = ''
          }
        }
      }

      container.addEventListener('scroll', handleScroll, { passive: true })
      window.addEventListener('scroll', handleScroll, { passive: true })

      // Mark as applied
      sliderElement.dataset.stickyApplied = 'true'

      // Cleanup function
      return () => {
        container.removeEventListener('scroll', handleScroll)
        window.removeEventListener('scroll', handleScroll)
      }
    }

    // Function để tìm và apply cho tất cả slider
    const applyToAllSliders = () => {
      const allSliders = document.querySelectorAll('input[type="range"]')
      allSliders.forEach((slider) => {
        applyStickyToSlider(slider as HTMLInputElement)
      })
    }

    // Apply ngay lập tức
    applyToAllSliders()

    // Observer để tự động apply cho slider mới
    const observer = new MutationObserver(() => {
      applyToAllSliders()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    // Cleanup
    return () => {
      observer.disconnect()
    }
  }, [])

  return <>{children}</>
}

