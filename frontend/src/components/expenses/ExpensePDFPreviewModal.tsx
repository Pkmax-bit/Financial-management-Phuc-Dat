/**
 * ExpensePDFPreviewModal - Preview PDF before downloading
 */

import React from 'react'
import { X, Download } from 'lucide-react'
import { generateExpensePDFHTML } from '@/utils/exportExpensePDF'

interface ExpenseItem {
    section?: string
    productName: string
    description?: string
    unitPrice: number
    quantity: number
    unit: string
    area?: number
    lineTotal: number
    components?: {
        [expenseObjectId: string]: {
            percentage?: number
            quantity?: number
            unitPrice?: number
            amount: number
        }
    }
}

interface ExpenseObject {
    id: string
    name: string
    level?: number
    parent_id?: string
}

interface PlannedExpenseData {
    id: string
    expense_code: string
    description: string
    amount: number
    currency: string
    expense_date: string
    project_name: string
    project_code: string
    customer_name?: string
    notes?: string
    invoice_items: ExpenseItem[]
    expense_objects: ExpenseObject[]
    expense_object_totals: { [objectId: string]: number }
    company_info?: {
        company_name?: string
        company_showroom?: string
        company_factory?: string
        company_website?: string
        company_hotline?: string
        company_logo_url?: string
        company_logo_base64?: string
    }
}

interface ExpensePDFPreviewModalProps {
    isOpen: boolean
    onClose: () => void
    pdfData: PlannedExpenseData | null
    onDownload: () => Promise<void>
}

export default function ExpensePDFPreviewModal({
    isOpen,
    onClose,
    pdfData,
    onDownload
}: ExpensePDFPreviewModalProps) {
    if (!isOpen || !pdfData) return null

    const htmlContent = generateExpensePDFHTML(pdfData)

    const handleDownload = async () => {
        await onDownload()
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="relative bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Xem Trước PDF Chi Phí Kế Hoạch
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500 transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Content - PDF Preview */}
                    <div className="flex-1 overflow-auto p-6 bg-gray-100">
                        <div className="bg-white shadow-lg mx-auto" style={{ maxWidth: '1123px' }}>
                            <div
                                dangerouslySetInnerHTML={{ __html: htmlContent }}
                                className="pdf-preview-content"
                                style={{
                                    transform: 'scale(0.85)',
                                    transformOrigin: 'top center',
                                    width: '117.6%',
                                    marginLeft: '-8.8%'
                                }}
                            />
                        </div>
                    </div>

                    {/* Footer - Actions */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            Đóng
                        </button>
                        <button
                            onClick={handleDownload}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            Tải PDF
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .pdf-preview-content {
          font-family: Arial, "Times New Roman", "DejaVu Sans", sans-serif;
        }
      `}</style>
        </div>
    )
}
