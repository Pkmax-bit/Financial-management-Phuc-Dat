'use client'

import { useState, useEffect } from 'react'
import { X, Check, Image as ImageIcon, Palette, Grid3x3, Zap, Waves } from 'lucide-react'
import { useBackground, type BackgroundConfig, type BackgroundType } from '@/contexts/BackgroundContext'

interface BackgroundSettingsProps {
  isOpen: boolean
  onClose: () => void
}

const backgroundPresets: Array<{
  type: BackgroundType
  name: string
  description: string
  preview: React.ReactNode
  config: BackgroundConfig
}> = [
  {
    type: 'diagonal-cross-grid',
    name: 'Lưới chéo chéo',
    description: 'Mẫu lưới chéo chéo cổ điển',
    preview: (
      <div className="w-full h-full relative">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(45deg, transparent 49%, #e5e7eb 49%, #e5e7eb 51%, transparent 51%),
              linear-gradient(-45deg, transparent 49%, #e5e7eb 49%, #e5e7eb 51%, transparent 51%)
            `,
            backgroundSize: '40px 40px',
          }}
        />
      </div>
    ),
    config: { type: 'diagonal-cross-grid', size: '40px' }
  },
  {
    type: 'solid-white',
    name: 'Trắng',
    description: 'Nền trắng thuần',
    preview: <div className="w-full h-full bg-white" />,
    config: { type: 'solid-white' }
  },
  {
    type: 'solid-gray',
    name: 'Xám nhạt',
    description: 'Nền xám nhạt',
    preview: <div className="w-full h-full bg-gray-50" />,
    config: { type: 'solid-gray' }
  },
  {
    type: 'solid-blue',
    name: 'Xanh nhạt',
    description: 'Nền xanh nhạt',
    preview: <div className="w-full h-full bg-blue-50" />,
    config: { type: 'solid-blue' }
  },
  {
    type: 'dots',
    name: 'Chấm',
    description: 'Mẫu chấm nhỏ',
    preview: (
      <div className="w-full h-full relative">
        <div
          className="absolute inset-0 bg-white"
          style={{
            backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
      </div>
    ),
    config: { type: 'dots', size: '20px' }
  },
  {
    type: 'dots-large',
    name: 'Chấm lớn',
    description: 'Mẫu chấm lớn hơn',
    preview: (
      <div className="w-full h-full relative">
        <div
          className="absolute inset-0 bg-white"
          style={{
            backgroundImage: 'radial-gradient(circle, #e5e7eb 2px, transparent 2px)',
            backgroundSize: '30px 30px',
          }}
        />
      </div>
    ),
    config: { type: 'dots-large', size: '30px' }
  },
  {
    type: 'dots-small',
    name: 'Chấm nhỏ',
    description: 'Mẫu chấm rất nhỏ',
    preview: (
      <div className="w-full h-full relative">
        <div
          className="absolute inset-0 bg-white"
          style={{
            backgroundImage: 'radial-gradient(circle, #e5e7eb 0.5px, transparent 0.5px)',
            backgroundSize: '15px 15px',
          }}
        />
      </div>
    ),
    config: { type: 'dots-small', size: '15px' }
  },
  {
    type: 'dots-cross',
    name: 'Chấm chéo',
    description: 'Mẫu chấm chéo nhau',
    preview: (
      <div className="w-full h-full relative">
        <div
          className="absolute inset-0 bg-white"
          style={{
            backgroundImage: `
              radial-gradient(circle, #e5e7eb 1px, transparent 1px),
              radial-gradient(circle, #e5e7eb 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px, 40px 40px',
            backgroundPosition: '0 0, 10px 10px',
          }}
        />
      </div>
    ),
    config: { type: 'dots-cross' }
  },
  {
    type: 'grid',
    name: 'Lưới',
    description: 'Mẫu lưới vuông',
    preview: (
      <div className="w-full h-full relative">
        <div
          className="absolute inset-0 bg-white"
          style={{
            backgroundImage: `
              linear-gradient(#e5e7eb 1px, transparent 1px),
              linear-gradient(90deg, #e5e7eb 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
      </div>
    ),
    config: { type: 'grid', size: '40px' }
  },
  {
    type: 'grid-small',
    name: 'Lưới nhỏ',
    description: 'Lưới vuông nhỏ',
    preview: (
      <div className="w-full h-full relative">
        <div
          className="absolute inset-0 bg-white"
          style={{
            backgroundImage: `
              linear-gradient(#e5e7eb 1px, transparent 1px),
              linear-gradient(90deg, #e5e7eb 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
        />
      </div>
    ),
    config: { type: 'grid-small', size: '20px' }
  },
  {
    type: 'grid-large',
    name: 'Lưới lớn',
    description: 'Lưới vuông lớn',
    preview: (
      <div className="w-full h-full relative">
        <div
          className="absolute inset-0 bg-white"
          style={{
            backgroundImage: `
              linear-gradient(#e5e7eb 1px, transparent 1px),
              linear-gradient(90deg, #e5e7eb 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>
    ),
    config: { type: 'grid-large', size: '60px' }
  },
  {
    type: 'grid-thick',
    name: 'Lưới dày',
    description: 'Lưới với đường dày',
    preview: (
      <div className="w-full h-full relative">
        <div
          className="absolute inset-0 bg-white"
          style={{
            backgroundImage: `
              linear-gradient(#e5e7eb 2px, transparent 2px),
              linear-gradient(90deg, #e5e7eb 2px, transparent 2px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
      </div>
    ),
    config: { type: 'grid-thick', size: '40px' }
  },
  {
    type: 'grid-thin',
    name: 'Lưới mỏng',
    description: 'Lưới với đường mỏng',
    preview: (
      <div className="w-full h-full relative">
        <div
          className="absolute inset-0 bg-white"
          style={{
            backgroundImage: `
              linear-gradient(#e5e7eb 0.5px, transparent 0.5px),
              linear-gradient(90deg, #e5e7eb 0.5px, transparent 0.5px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
      </div>
    ),
    config: { type: 'grid-thin', size: '40px' }
  },
  {
    type: 'diagonal-lines',
    name: 'Đường chéo',
    description: 'Đường chéo đơn',
    preview: (
      <div className="w-full h-full relative">
        <div
          className="absolute inset-0 bg-white"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #e5e7eb 10px, #e5e7eb 11px)',
          }}
        />
      </div>
    ),
    config: { type: 'diagonal-lines' }
  },
  {
    type: 'vertical-lines',
    name: 'Đường dọc',
    description: 'Đường thẳng đứng',
    preview: (
      <div className="w-full h-full relative">
        <div
          className="absolute inset-0 bg-white"
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 39px, #e5e7eb 39px, #e5e7eb 40px)',
          }}
        />
      </div>
    ),
    config: { type: 'vertical-lines' }
  },
  {
    type: 'horizontal-lines',
    name: 'Đường ngang',
    description: 'Đường thẳng ngang',
    preview: (
      <div className="w-full h-full relative">
        <div
          className="absolute inset-0 bg-white"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 39px, #e5e7eb 39px, #e5e7eb 40px)',
          }}
        />
      </div>
    ),
    config: { type: 'horizontal-lines' }
  },
  {
    type: 'isometric-grid',
    name: 'Lưới isometric',
    description: 'Lưới 3D isometric',
    preview: (
      <div className="w-full h-full relative">
        <div
          className="absolute inset-0 bg-white"
          style={{
            backgroundImage: `
              linear-gradient(30deg, transparent 0%, transparent 50%, rgba(229, 231, 235, 0.5) 50%, rgba(229, 231, 235, 0.5) 51%, transparent 51%),
              linear-gradient(-30deg, transparent 0%, transparent 50%, rgba(229, 231, 235, 0.5) 50%, rgba(229, 231, 235, 0.5) 51%, transparent 51%),
              linear-gradient(90deg, transparent 0%, transparent 50%, rgba(229, 231, 235, 0.3) 50%, rgba(229, 231, 235, 0.3) 51%, transparent 51%)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>
    ),
    config: { type: 'isometric-grid' }
  },
  {
    type: 'hexagonal-grid',
    name: 'Lưới lục giác',
    description: 'Mẫu lưới lục giác',
    preview: (
      <div className="w-full h-full relative">
        <div
          className="absolute inset-0 bg-white"
          style={{
            backgroundImage: `
              linear-gradient(120deg, #e5e7eb 0px, #e5e7eb 1px, transparent 1px, transparent 60px),
              linear-gradient(60deg, #e5e7eb 0px, #e5e7eb 1px, transparent 1px, transparent 60px),
              linear-gradient(0deg, #e5e7eb 0px, #e5e7eb 1px, transparent 1px, transparent 60px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>
    ),
    config: { type: 'hexagonal-grid' }
  },
  {
    type: 'grid-spotlight',
    name: 'Lưới Spotlight',
    description: 'Grid với màu xanh lá đặc biệt',
    preview: (
      <div className="w-full h-full relative">
        <div
          className="absolute inset-0 bg-white"
          style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(16,185,129,0.25) 1px, transparent 0),
              linear-gradient(180deg, rgba(16,185,129,0.25) 1px, transparent 0),
              repeating-linear-gradient(45deg, rgba(16,185,129,0.2) 0 2px, transparent 2px 6px)
            `,
            backgroundSize: '24px 24px, 24px 24px, 24px 24px',
          }}
        />
      </div>
    ),
    config: { type: 'grid-spotlight' }
  },
  {
    type: 'waves',
    name: 'Sóng',
    description: 'Mẫu sóng mềm mại',
    preview: (
      <div className="w-full h-full relative">
        <div
          className="absolute inset-0 bg-white"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                #e5e7eb 10px,
                #e5e7eb 11px
              )
            `,
          }}
        />
      </div>
    ),
    config: { type: 'waves' }
  }
]

export default function BackgroundSettings({ isOpen, onClose }: BackgroundSettingsProps) {
  const { background, setBackground } = useBackground()
  const [selectedType, setSelectedType] = useState<BackgroundType>(background.type)

  // Sync selectedType when modal opens or background changes
  useEffect(() => {
    if (isOpen) {
      setSelectedType(background.type)
    }
  }, [isOpen, background.type])

  if (!isOpen) return null

  const handleSelectBackground = (config: BackgroundConfig) => {
    // Apply immediately when clicked
    setBackground(config)
    setSelectedType(config.type)
  }

  const handleSave = () => {
    // Background already applied when selected, just close
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Palette className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Cài đặt nền</h2>
              <p className="text-sm text-gray-600">Chọn và tùy chỉnh nền cho ứng dụng</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {backgroundPresets.map((preset) => {
              const isSelected = selectedType === preset.type
              
              return (
                <button
                  key={preset.type}
                  onClick={() => handleSelectBackground(preset.config)}
                  className={`relative p-3 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  {/* Preview */}
                  <div className="w-full h-24 mb-3 rounded-md overflow-hidden border border-gray-200 bg-white">
                    {preset.preview}
                  </div>
                  
                  {/* Info */}
                  <div className="text-left">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-semibold text-gray-900">{preset.name}</h3>
                      {isSelected && (
                        <Check className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{preset.description}</p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Custom Background Option */}
          <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center space-x-2 mb-2">
              <ImageIcon className="h-5 w-5 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-900">Nền tùy chỉnh</h3>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Tính năng tải nền hình ảnh tùy chỉnh sẽ được phát triển trong phiên bản sau.
            </p>
            <button
              disabled
              className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed"
            >
              Sắp ra mắt
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  )
}

