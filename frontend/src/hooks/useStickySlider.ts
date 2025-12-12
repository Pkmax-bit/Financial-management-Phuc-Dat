import { useEffect, useRef, useState } from 'react'

interface UseStickySliderOptions {
  offset?: number // Offset từ top khi sticky (default: 20)
  enabled?: boolean // Có bật sticky không (default: true)
}

export function useStickySlider(options: UseStickySliderOptions = {}) {
  const { offset = 20, enabled = true } = options
  const sliderRef = useRef<HTMLDivElement>(null)
  const [isSticky, setIsSticky] = useState(false)
  const [containerTop, setContainerTop] = useState(0)

  useEffect(() => {
    if (!enabled) return

    const handleScroll = () => {
      if (!sliderRef.current) return

      // Tìm container scroll gần nhất
      const container = sliderRef.current.closest(
        '.overflow-y-auto, .overflow-auto, [class*="scroll"], [class*="overflow"]'
      ) as HTMLElement

      if (!container) {
        // Nếu không tìm thấy container scroll, dùng window
        const rect = sliderRef.current.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const shouldSticky = rect.top < offset && rect.bottom > viewportHeight - offset
        setIsSticky(shouldSticky)
        return
      }

      const containerRect = container.getBoundingClientRect()
      const sliderRect = sliderRef.current.getBoundingClientRect()

      // Kiểm tra nếu slider đang trong viewport và container đang scroll
      const isInViewport =
        sliderRect.top < containerRect.bottom && sliderRect.bottom > containerRect.top
      const shouldSticky = isInViewport && sliderRect.top < containerRect.top + offset

      setIsSticky(shouldSticky)
      if (shouldSticky) {
        setContainerTop(containerRect.top)
      }
    }

    // Tìm container scroll
    const container = sliderRef.current?.closest(
      '.overflow-y-auto, .overflow-auto, [class*="scroll"], [class*="overflow"]'
    ) as HTMLElement

    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true })
    } else {
      window.addEventListener('scroll', handleScroll, { passive: true })
    }

    // Kiểm tra ban đầu
    handleScroll()

    // Resize observer để xử lý khi container thay đổi kích thước
    const resizeObserver = new ResizeObserver(handleScroll)
    if (sliderRef.current) {
      resizeObserver.observe(sliderRef.current)
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll)
      } else {
        window.removeEventListener('scroll', handleScroll)
      }
      resizeObserver.disconnect()
    }
  }, [offset, enabled])

  return {
    sliderRef,
    isSticky,
    containerTop,
    stickyStyle: isSticky
      ? {
          position: 'sticky' as const,
          top: `${containerTop + offset}px`,
          zIndex: 50,
        }
      : {},
    stickyClassName: isSticky
      ? 'bg-white py-3 px-4 rounded-lg shadow-md border border-gray-200 -mx-4 transition-all duration-200'
      : 'transition-all duration-200',
  }
}

