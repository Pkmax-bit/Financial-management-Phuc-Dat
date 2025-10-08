/**
 * Website Tour Component - Hướng dẫn người dùng
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  RotateCcw,
  HelpCircle,
  Lightbulb,
  Target,
  CheckCircle,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  ArrowLeft,
  Move
} from 'lucide-react'

interface TourStep {
  id: string
  title: string
  description: string
  target: string // CSS selector
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
  action?: string
  highlight?: boolean
  showSkip?: boolean
}

interface WebsiteTourProps {
  isOpen: boolean
  onClose: () => void
  tourId: string
  steps: TourStep[]
  onComplete?: () => void
}

export default function WebsiteTour({ 
  isOpen, 
  onClose, 
  tourId, 
  steps, 
  onComplete 
}: WebsiteTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [overlayStyle, setOverlayStyle] = useState({})
  const [tooltipStyle, setTooltipStyle] = useState({})
  const [isAnimating, setIsAnimating] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 })
  const [isDraggable, setIsDraggable] = useState(true)
  
  const tourRef = useRef<HTMLDivElement>(null)
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null)
  const dragStartRef = useRef({ x: 0, y: 0 })

  // Check if tour was completed before - DISABLED FOR TESTING
  useEffect(() => {
    // Temporarily disabled for testing
    // const completedTours = JSON.parse(localStorage.getItem('completedTours') || '[]')
    // if (completedTours.includes(tourId)) {
    //   onClose()
    // }
  }, [tourId, onClose])

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && isOpen) {
      autoPlayRef.current = setInterval(() => {
        nextStep()
      }, 4000) // Auto advance every 4 seconds
    } else {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
        autoPlayRef.current = null
      }
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
      }
    }
  }, [isPlaying, isOpen])

  // Update target element and positioning
  useEffect(() => {
    if (!isOpen || steps.length === 0) return

    const step = steps[currentStep]
    
    // Safety check - if step is undefined, return early
    if (!step) {
      console.warn(`Tour step at index ${currentStep} is undefined`)
      return
    }
    
    const element = document.querySelector(step.target) as HTMLElement
    
    if (element) {
      setTargetElement(element)
      updatePositioning(element, step.position)
    } else {
      console.warn(`Target element not found for selector: ${step.target}`)
    }
  }, [currentStep, isOpen, steps])

  const updatePositioning = (element: HTMLElement, position: string) => {
    const rect = element.getBoundingClientRect()
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft

    // Create overlay that highlights the target element
    setOverlayStyle({
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 9998,
      pointerEvents: 'none'
    })

    // Always left side positioning initially, then allow dragging
    if (isDragging && dragPosition.x !== 0 && dragPosition.y !== 0) {
      setTooltipStyle({
        position: 'fixed',
        top: dragPosition.y,
        left: dragPosition.x,
        transform: 'translate(-50%, -50%)',
        zIndex: 9999
      })
      return
    }

    // Default to left side position - overlay on sidebar
    setTooltipStyle({
      position: 'fixed',
      top: '50%',
      left: '280px', // Position over sidebar (sidebar is typically 256px wide)
      transform: 'translateY(-50%)',
      zIndex: 9999
    })

    // Scroll to element if needed
    element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center', 
      inline: 'center' 
    })
  }

  // Drag and drop handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDraggable) return
    
    // Only allow dragging from the header area
    const target = e.target as HTMLElement
    if (!target.closest('[data-drag-handle]')) return
    
    setIsDragging(true)
    const rect = tourRef.current?.getBoundingClientRect()
    if (rect) {
      dragStartRef.current = {
        x: e.clientX - rect.left - rect.width / 2,
        y: e.clientY - rect.top - rect.height / 2
      }
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    e.preventDefault()
    e.stopPropagation()
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return
    
    const newX = e.clientX - dragStartRef.current.x
    const newY = e.clientY - dragStartRef.current.y
    
    // Constrain to viewport
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const tooltipWidth = 400 // Approximate tooltip width
    const tooltipHeight = 300 // Approximate tooltip height
    
    const constrainedX = Math.max(tooltipWidth / 2, Math.min(viewportWidth - tooltipWidth / 2, newX))
    const constrainedY = Math.max(tooltipHeight / 2, Math.min(viewportHeight - tooltipHeight / 2, newY))
    
    setDragPosition({ x: constrainedX, y: constrainedY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      completeTour()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }


  const completeTour = () => {
    // Mark tour as completed - DISABLED FOR TESTING
    // const completedTours = JSON.parse(localStorage.getItem('completedTours') || '[]')
    // if (!completedTours.includes(tourId)) {
    //   completedTours.push(tourId)
    //   localStorage.setItem('completedTours', JSON.stringify(completedTours))
    // }
    
    onComplete?.()
    onClose()
  }

  const skipTour = () => {
    completeTour()
  }

  const toggleAutoPlay = () => {
    setIsPlaying(!isPlaying)
  }

  const resetTour = () => {
    setCurrentStep(0)
    setIsPlaying(false)
  }

  if (!isOpen || steps.length === 0) return null

  // Ensure currentStep is within bounds
  const safeCurrentStep = Math.max(0, Math.min(currentStep, steps.length - 1))
  if (currentStep !== safeCurrentStep) {
    setCurrentStep(safeCurrentStep)
    return null // Let the component re-render with correct step
  }

  const currentStepData = steps[safeCurrentStep]
  
  // Safety check - if currentStepData is undefined, return null
  if (!currentStepData) {
    console.warn(`Tour step at index ${safeCurrentStep} is undefined`)
    return null
  }
  
  const progress = ((safeCurrentStep + 1) / steps.length) * 100

  return (
    <>
      {/* Overlay */}
      <div style={overlayStyle} />
      
      {/* Highlight target element */}
      {targetElement && (
        <div
          style={{
            position: 'fixed',
            top: targetElement.getBoundingClientRect().top + window.pageYOffset - 4,
            left: targetElement.getBoundingClientRect().left + window.pageXOffset - 4,
            width: targetElement.getBoundingClientRect().width + 8,
            height: targetElement.getBoundingClientRect().height + 8,
            border: '3px solid #3B82F6',
            borderRadius: '8px',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            zIndex: 9997,
            pointerEvents: 'none',
            animation: 'pulse 2s infinite'
          }}
        />
      )}

      {/* Tour Tooltip */}
      <div
        ref={tourRef}
        style={tooltipStyle}
        className={`bg-white rounded-lg shadow-2xl border border-gray-200 max-w-xs p-3 ${
          isAnimating ? 'animate-fadeIn' : ''
        } ${isDragging ? 'cursor-move' : ''}`}
        onMouseDown={handleMouseDown}
      >
        {/* Drag Handle */}
        <div 
          className="flex items-center justify-between mb-2 cursor-move" 
          data-drag-handle
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center space-x-1 flex-1">
            <div className="p-1 bg-blue-100 rounded-full">
              <Lightbulb className="h-3 w-3 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-xs">
                {currentStepData.title}
              </h3>
              <p className="text-xs text-gray-500">
                {safeCurrentStep + 1}/{steps.length}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-0.5">
            <button
              onClick={() => setIsDraggable(!isDraggable)}
              className={`p-1 rounded-md transition-colors ${
                isDraggable 
                  ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={isDraggable ? 'Tắt kéo thả' : 'Bật kéo thả'}
            >
              <Target className="h-2.5 w-2.5" />
            </button>
            
            <button
              onClick={() => {
                setDragPosition({ x: 0, y: 0 })
                setIsDragging(false)
              }}
              className="p-1 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors"
              title="Đặt lại vị trí"
            >
              <ArrowUp className="h-2.5 w-2.5" />
            </button>
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Drag Indicator */}
        {isDraggable && (
          <div className="mb-2 p-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded border border-blue-200">
            <div className="flex items-center space-x-1 text-xs text-blue-700">
              <Target className="h-2.5 w-2.5 animate-pulse" />
              <span className="font-medium text-xs">💡 Kéo</span>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-1 mb-2">
          <div 
            className="bg-blue-600 h-1 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="mb-3">
          <p className="text-gray-700 leading-relaxed whitespace-pre-line text-xs">
            {currentStepData.description}
          </p>
          
          {currentStepData.action && (
            <div className="mt-1.5 p-1.5 bg-blue-50 rounded">
              <div className="flex items-center space-x-1">
                <Target className="h-2.5 w-2.5 text-blue-600" />
                <span className="text-xs font-medium text-blue-800">
                  {currentStepData.action}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-0.5">
            <button
              onClick={toggleAutoPlay}
              className={`p-1 rounded-md transition-colors ${
                isPlaying 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'bg-green-100 text-green-600 hover:bg-green-200'
              }`}
              title={isPlaying ? 'Tạm dừng' : 'Tự động phát'}
            >
              {isPlaying ? <Pause className="h-2.5 w-2.5" /> : <Play className="h-2.5 w-2.5" />}
            </button>
            
            <button
              onClick={resetTour}
              className="p-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
              title="Bắt đầu lại"
            >
              <RotateCcw className="h-2.5 w-2.5" />
            </button>
          </div>

          <div className="flex items-center space-x-0.5">
            <button
              onClick={prevStep}
              disabled={safeCurrentStep === 0}
              className="p-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-2.5 w-2.5" />
            </button>
            
            <button
              onClick={nextStep}
              className="p-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {safeCurrentStep === steps.length - 1 ? (
                <CheckCircle className="h-2.5 w-2.5" />
              ) : (
                <ChevronRight className="h-2.5 w-2.5" />
              )}
            </button>
          </div>
        </div>

        {/* Skip Button */}
        {currentStepData.showSkip !== false && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <button
              onClick={skipTour}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              Bỏ qua
            </button>
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  )
}

// Hook for managing tour state
export function useTour(tourId: string, steps: TourStep[]) {
  const [isOpen, setIsOpen] = useState(false)
  const [hasCompleted, setHasCompleted] = useState(false)

  useEffect(() => {
    // DISABLED FOR TESTING - Always show as not completed
    // const completedTours = JSON.parse(localStorage.getItem('completedTours') || '[]')
    // setHasCompleted(completedTours.includes(tourId))
    setHasCompleted(false) // Always false for testing
  }, [tourId])

  const startTour = () => {
    setIsOpen(true)
  }

  const closeTour = () => {
    setIsOpen(false)
  }

  const completeTour = () => {
    // DISABLED FOR TESTING
    // const completedTours = JSON.parse(localStorage.getItem('completedTours') || '[]')
    // if (!completedTours.includes(tourId)) {
    //   completedTours.push(tourId)
    //   localStorage.setItem('completedTours', JSON.stringify(completedTours))
    // }
    setHasCompleted(true)
    setIsOpen(false)
  }

  const resetTour = () => {
    // DISABLED FOR TESTING
    // const completedTours = JSON.parse(localStorage.getItem('completedTours') || '[]')
    // const updatedTours = completedTours.filter((id: string) => id !== tourId)
    // localStorage.setItem('completedTours', JSON.stringify(updatedTours))
    setHasCompleted(false)
  }

  return {
    isOpen,
    hasCompleted,
    startTour,
    closeTour,
    completeTour,
    resetTour
  }
}