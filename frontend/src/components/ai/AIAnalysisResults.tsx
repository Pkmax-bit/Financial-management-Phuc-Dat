'use client'

import { useState } from 'react'
import { CheckCircle, AlertCircle, Download, Copy, Edit, Save, X } from 'lucide-react'

interface AIAnalysis {
  amount: number
  vendor: string
  date: string
  description: string
  project_name?: string
  project_code?: string
  project_mention: boolean
  category: string
  confidence: number
}

interface MatchedProject {
  id: string
  name: string
  project_code: string
}

interface AIAnalysisResultsProps {
  analysis: AIAnalysis
  matchedProject: MatchedProject | null
  availableProjects: MatchedProject[]
  selectedProjectId: string
  onProjectSelect: (projectId: string) => void
  onSaveExpense: () => void
  onCopyResult: (text: string) => void
  onDownloadResult: () => void
}

export default function AIAnalysisResults({
  analysis,
  matchedProject,
  availableProjects,
  selectedProjectId,
  onProjectSelect,
  onSaveExpense,
  onCopyResult,
  onDownloadResult
}: AIAnalysisResultsProps) {
  const [editing, setEditing] = useState(false)
  const [editedData, setEditedData] = useState<AIAnalysis>(analysis)

  const handleEditField = (field: keyof AIAnalysis, value: any) => {
    setEditedData({
      ...editedData,
      [field]: value
    })
  }

  const handleSave = () => {
    setEditing(false)
    onSaveExpense()
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100 text-green-800'
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 80) return <CheckCircle className="h-4 w-4 text-green-500" />
    if (confidence >= 60) return <AlertCircle className="h-4 w-4 text-yellow-500" />
    return <AlertCircle className="h-4 w-4 text-red-500" />
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Kết Quả AI Analysis</h2>
        <div className="flex gap-2">
          <button
            onClick={() => onDownloadResult()}
            className="p-2 text-gray-400 hover:text-blue-600"
            title="Tải xuống kết quả"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={() => onCopyResult(JSON.stringify(analysis, null, 2))}
            className="p-2 text-gray-400 hover:text-green-600"
            title="Sao chép kết quả"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Confidence Score */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getConfidenceIcon(analysis.confidence)}
            <span className="text-sm font-medium text-blue-800">Độ tin cậy AI</span>
          </div>
          <span className={`px-3 py-1 text-sm rounded-full ${getConfidenceColor(analysis.confidence)}`}>
            {analysis.confidence}%
          </span>
        </div>
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                analysis.confidence >= 80 ? 'bg-green-500' :
                analysis.confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${analysis.confidence}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Project Matching */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          {matchedProject ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-green-700 font-medium">Đã tìm thấy dự án</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <span className="text-yellow-700 font-medium">Chưa tìm thấy dự án</span>
            </>
          )}
        </div>
        
        {matchedProject ? (
          <div className="bg-green-100 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800">
              <strong>Dự án:</strong> {matchedProject.name} ({matchedProject.project_code})
            </p>
          </div>
        ) : (
          <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800 mb-2">
              Không tìm thấy dự án phù hợp. Bạn có thể chọn thủ công:
            </p>
            <select 
              value={selectedProjectId}
              onChange={(e) => onProjectSelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Chọn dự án</option>
              {availableProjects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name} ({project.project_code})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Analysis Details */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Chi tiết phân tích</h3>
          <button
            onClick={() => setEditing(!editing)}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            {editing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
            {editing ? 'Hủy' : 'Chỉnh sửa'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền</label>
            <input
              type="number"
              value={editing ? editedData.amount : analysis.amount}
              onChange={(e) => editing && handleEditField('amount', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              readOnly={!editing}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nhà cung cấp</label>
            <input
              type="text"
              value={editing ? editedData.vendor : analysis.vendor}
              onChange={(e) => editing && handleEditField('vendor', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              readOnly={!editing}
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
          <textarea
            value={editing ? editedData.description : analysis.description}
            onChange={(e) => editing && handleEditField('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={3}
            readOnly={!editing}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
            <input
              type="date"
              value={editing ? editedData.date : analysis.date}
              onChange={(e) => editing && handleEditField('date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              readOnly={!editing}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
            <select
              value={editing ? editedData.category : analysis.category}
              onChange={(e) => editing && handleEditField('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={!editing}
            >
              <option value="travel">Đi lại</option>
              <option value="meals">Ăn uống</option>
              <option value="accommodation">Lưu trú</option>
              <option value="transportation">Vận chuyển</option>
              <option value="supplies">Vật tư</option>
              <option value="equipment">Thiết bị</option>
              <option value="training">Đào tạo</option>
              <option value="other">Khác</option>
            </select>
          </div>
        </div>

        {/* Project Info */}
        {(analysis.project_name || analysis.project_code) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Thông tin dự án từ AI:</h4>
            <div className="text-sm text-blue-700">
              {analysis.project_name && <p><strong>Tên dự án:</strong> {analysis.project_name}</p>}
              {analysis.project_code && <p><strong>Mã dự án:</strong> {analysis.project_code}</p>}
              <p><strong>Đề cập dự án:</strong> {analysis.project_mention ? 'Có' : 'Không'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={() => setEditing(false)}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Hủy
        </button>
        {editing ? (
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Save className="h-4 w-4" />
            Lưu thay đổi
          </button>
        ) : (
          <button
            onClick={onSaveExpense}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Save className="h-4 w-4" />
            Lưu chi phí
          </button>
        )}
      </div>
    </div>
  )
}
