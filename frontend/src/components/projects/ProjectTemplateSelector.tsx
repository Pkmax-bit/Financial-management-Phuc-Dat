'use client'

import { useState } from 'react'

export interface ProjectTemplate {
    id: string
    name: string
    budget: string
    duration_days: number
    priority: 'low' | 'medium' | 'high' | 'urgent'
    description: string
}

const TEMPLATES: ProjectTemplate[] = [
    {
        id: 'small',
        name: 'Dự án nhỏ',
        budget: '50000000',
        duration_days: 30,
        priority: 'medium',
        description: 'Dự án quy mô nhỏ, dưới 50 triệu, hoàn thành trong 1 tháng'
    },
    {
        id: 'medium',
        name: 'Dự án vừa',
        budget: '200000000',
        duration_days: 90,
        priority: 'high',
        description: 'Dự án quy mô vừa, 50-200 triệu, hoàn thành trong 3 tháng'
    },
    {
        id: 'large',
        name: 'Dự án lớn',
        budget: '500000000',
        duration_days: 180,
        priority: 'high',
        description: 'Dự án quy mô lớn, trên 200 triệu, hoàn thành trong 6 tháng'
    }
]

interface ProjectTemplateSelectorProps {
    onSelect: (template: any) => void
}

export default function ProjectTemplateSelector({ onSelect }: ProjectTemplateSelectorProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

    const handleSelect = (template: ProjectTemplate) => {
        setSelectedTemplate(template.id)

        // Calculate dates based on duration
        const startDate = new Date()
        const endDate = new Date()
        endDate.setDate(endDate.getDate() + template.duration_days)

        const formattedData = {
            budget: template.budget,
            priority: template.priority,
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0]
        }

        onSelect(formattedData)
    }

    return (
        <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-700">
                Chọn mẫu dự án (không bắt buộc)
            </label>
            <div className="grid grid-cols-3 gap-4">
                {TEMPLATES.map(template => (
                    <button
                        key={template.id}
                        type="button"
                        onClick={() => handleSelect(template)}
                        className={`p-4 border rounded-lg text-left transition-all ${selectedTemplate === template.id
                                ? 'bg-blue-50 border-blue-500 shadow-md'
                                : 'hover:bg-gray-50 border-gray-300 hover:border-gray-400'
                            }`}
                    >
                        <div className="font-semibold text-gray-900">{template.name}</div>
                        <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {template.description}
                        </div>
                        <div className="text-sm text-gray-700 mt-2 font-medium">
                            {parseInt(template.budget).toLocaleString()}đ
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            Thời gian: {template.duration_days} ngày
                        </div>
                    </button>
                ))}
            </div>
        </div>
    )
}
