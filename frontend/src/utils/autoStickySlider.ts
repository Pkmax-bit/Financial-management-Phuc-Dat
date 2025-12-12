/**
 * Utility để tự động áp dụng sticky cho tất cả slider trong DOM
 * Gọi function này sau khi render để tự động wrap tất cả slider
 */
export function applyAutoStickyToAllSliders() {
  // Tìm tất cả range input
  const rangeInputs = document.querySelectorAll('input[type="range"]')
  
  rangeInputs.forEach((input) => {
    // Bỏ qua nếu đã được wrap
    if (input.closest('.sticky-slider-wrapper')) {
      return
    }

    // Tìm parent container phù hợp để wrap
    let parent = input.parentElement
    if (!parent) return

    // Tạo wrapper
    const wrapper = document.createElement('div')
    wrapper.className = 'sticky-slider-wrapper'
    
    // Insert wrapper trước input
    parent.insertBefore(wrapper, input)
    // Move input vào wrapper
    wrapper.appendChild(input)
  })
}

/**
 * Observer để tự động áp dụng sticky khi có slider mới được thêm vào DOM
 */
export function initAutoStickyObserver() {
  const observer = new MutationObserver(() => {
    applyAutoStickyToAllSliders()
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })

  // Apply ngay lập tức
  applyAutoStickyToAllSliders()

  return observer
}

