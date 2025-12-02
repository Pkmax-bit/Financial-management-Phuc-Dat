'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Mail, Download, Settings, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { generateExpensePDFHTML, exportExpenseToPDF } from '@/utils/exportExpensePDF'

interface CompanySettings {
    company_name: string
    company_showroom: string
    company_factory: string
    company_hotline: string
    company_website: string
    company_logo_url: string
}

export default function ExpenseEditPage() {
    const params = useParams()
    const router = useRouter()
    const expenseId = params.expenseId as string

    const [loading, setLoading] = useState(true)
    const [expenseData, setExpenseData] = useState<any>(null)
    const [pdfData, setPdfData] = useState<any>(null)
    const [companySettings, setCompanySettings] = useState<CompanySettings>({
        company_name: 'Công ty TNHH Cửa Phúc Đạt',
        company_showroom: '',
        company_factory: '',
        company_hotline: '',
        company_website: '',
        company_logo_url: ''
    })
    const [pdfSent, setPdfSent] = useState(false)
    const [emailSent, setEmailSent] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchExpenseData()
    }, [expenseId])

    const fetchExpenseData = async () => {
        try {
            setLoading(true)

            // Fetch expense data
            const { data: expense, error: expenseError } = await supabase
                .from('project_expenses_quote')
                .select(`
          *,
          projects:project_id(name, project_code),
          customers:customer_id(name)
        `)
                .eq('id', expenseId)
                .single()

            if (expenseError || !expense) {
                throw new Error('Không tìm thấy chi phí kế hoạch')
            }

            setExpenseData(expense)

            // Check if PDF/Email already sent
            const notes = expense.notes || ''
            setPdfSent(notes.includes('[PDF_SENT]'))
            setEmailSent(notes.includes('[EMAIL_SENT]'))

            // Fetch company settings
            const { data: settings } = await supabase
                .from('company_settings')
                .select('*')
                .limit(1)
                .single()

            if (settings) {
                setCompanySettings(settings)
            }

            // Prepare PDF data (reuse logic from ProjectExpensesTab)
            const pdfData = await preparePDFData(expense, settings)
            setPdfData(pdfData)

        } catch (error) {
            console.error('Error fetching expense data:', error)
            alert('Lỗi khi tải dữ liệu chi phí')
        } finally {
            setLoading(false)
        }
    }

    const preparePDFData = async (expense: any, settings: any) => {
        const projectId = expense.project_id

        // Fetch quote data
        const { data: quotesData } = await supabase
            .from('quotes')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })
            .limit(1)

        const quoteData = quotesData && quotesData.length > 0 ? quotesData[0] : null
        const quoteId = quoteData?.id

        // Fetch quote items
        let quoteItems: any[] = []
        if (quoteId) {
            const { data: itemsData } = await supabase
                .from('quote_items')
                .select(`
          *,
          products:product_service_id(id, name, description)
        `)
                .eq('quote_id', quoteId)
                .order('created_at', { ascending: true })

            quoteItems = itemsData || []
        }

        // Fetch expense objects
        const expenseObjectIds = expense.expense_object_columns || []
        let expenseObjects: any[] = []
        if (expenseObjectIds.length > 0) {
            const { data: objectsData } = await supabase
                .from('expense_objects')
                .select('id, name, level, parent_id')
                .in('id', expenseObjectIds)

            expenseObjects = objectsData || []
        }

        // Prepare invoice items
        let invoiceItems: any[] = []
        if (expense.invoice_items && Array.isArray(expense.invoice_items) && expense.invoice_items.length > 0) {
            invoiceItems = expense.invoice_items.map((item: any) => ({
                section: item.section || '',
                productName: item.productName || item.name_product || '',
                description: item.description || '',
                unitPrice: Number(item.unitPrice || item.unit_price || 0),
                quantity: Number(item.quantity || 0),
                unit: item.unit || 'cái',
                area: item.area ? Number(item.area) : undefined,
                lineTotal: Number(item.lineTotal || item.line_total || item.total_price || 0),
                components: item.components || {}
            }))
        } else if (quoteItems.length > 0) {
            invoiceItems = quoteItems.map((item: any) => {
                const product = item.products
                const productName = Array.isArray(product) ? (product[0]?.name || '') : (product?.name || '')

                return {
                    section: '',
                    productName: productName || item.name_product || item.product_name || '',
                    description: item.products?.description || item.description || '',
                    unitPrice: Number(item.unit_price || item.price || 0),
                    quantity: Number(item.quantity || item.qty || 0),
                    unit: item.unit || 'cái',
                    area: item.area ? Number(item.area) : undefined,
                    lineTotal: Number(item.total_price || item.subtotal || item.total || 0),
                    components: item.product_components || item.components || {}
                }
            })
        }

        // Fetch and convert logo
        let logoBase64 = ''
        if (settings?.company_logo_url) {
            try {
                const response = await fetch(settings.company_logo_url)
                const blob = await response.blob()
                logoBase64 = await new Promise((resolve) => {
                    const reader = new FileReader()
                    reader.onloadend = () => resolve(reader.result as string)
                    reader.readAsDataURL(blob)
                })
            } catch (err) {
                console.warn('Could not fetch logo:', err)
            }
        }

        const project = expense.projects as any
        const customer = expense.customers as any
        const projectName = Array.isArray(project) ? project[0]?.name : (project?.name || '')
        const projectCode = Array.isArray(project) ? project[0]?.project_code : (project?.project_code || '')
        const customerName = Array.isArray(customer) ? customer[0]?.name : (customer?.name || '')

        return {
            id: expense.id,
            expense_code: expense.expense_code || '',
            description: expense.description || '',
            amount: expense.amount || 0,
            currency: expense.currency || 'VND',
            expense_date: expense.expense_date || new Date().toISOString(),
            project_name: projectName,
            project_code: projectCode,
            customer_name: customerName,
            notes: expense.notes || '',
            invoice_items: invoiceItems,
            expense_objects: expenseObjects,
            expense_object_totals: expense.expense_object_totals || {},
            company_info: {
                company_name: settings?.company_name || 'Công ty TNHH Cửa Phúc Đạt',
                company_showroom: settings?.company_showroom || '',
                company_factory: settings?.company_factory || '',
                company_website: settings?.company_website || '',
                company_hotline: settings?.company_hotline || '',
                company_logo_url: settings?.company_logo_url || '',
                company_logo_base64: logoBase64
            }
        }
    }

    const handleUpdateCompanySettings = async () => {
        try {
            setSaving(true)

            // Update company settings in database
            const { error } = await supabase
                .from('company_settings')
                .upsert(companySettings)

            if (error) throw error

            // Refresh PDF data with new settings
            const updatedPdfData = await preparePDFData(expenseData, companySettings)
            setPdfData(updatedPdfData)

            alert('Cập nhật thông tin công ty thành công!')
        } catch (error) {
            console.error('Error updating company settings:', error)
            alert('Lỗi khi cập nhật thông tin công ty')
        } finally {
            setSaving(false)
        }
    }

    const handleDownloadPDF = async () => {
        try {
            if (!pdfData) return

            await exportExpenseToPDF(pdfData)

            // Mark as PDF sent
            const currentNotes = expenseData.notes || ''
            const updatedNotes = currentNotes.includes('[PDF_SENT]')
                ? currentNotes
                : `${currentNotes}\n[PDF_SENT]`.trim()

            await supabase
                .from('project_expenses_quote')
                .update({ notes: updatedNotes })
                .eq('id', expenseId)

            setPdfSent(true)
            alert('Tải PDF thành công!')
        } catch (error) {
            console.error('Error downloading PDF:', error)
            alert('Lỗi khi tải PDF')
        }
    }

    const handleSendEmail = async () => {
        try {
            // TODO: Implement email sending
            // For now, just mark as sent
            const currentNotes = expenseData.notes || ''
            const updatedNotes = currentNotes.includes('[EMAIL_SENT]')
                ? currentNotes
                : `${currentNotes}\n[EMAIL_SENT]`.trim()

            await supabase
                .from('project_expenses_quote')
                .update({ notes: updatedNotes })
                .eq('id', expenseId)

            setEmailSent(true)
            alert('Gửi email thành công! (Tính năng đang được phát triển)')
        } catch (error) {
            console.error('Error sending email:', error)
            alert('Lỗi khi gửi email')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!expenseData || !pdfData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-600">Không tìm thấy chi phí kế hoạch</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/expenses')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Chi Phí Kế Hoạch</h1>
                                <p className="text-sm text-gray-500">
                                    {expenseData.expense_code} - {pdfData.project_name}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleSendEmail}
                                disabled={emailSent}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${emailSent
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                            >
                                <Mail className="h-4 w-4" />
                                {emailSent ? 'Đã gửi Email' : 'Gửi Email'}
                            </button>
                            <button
                                onClick={handleDownloadPDF}
                                disabled={pdfSent}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${pdfSent
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-green-600 text-white hover:bg-green-700'
                                    }`}
                            >
                                <Download className="h-4 w-4" />
                                {pdfSent ? 'Đã tải PDF' : 'Tải PDF'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-12 gap-6">
                    {/* Left Sidebar - Company Settings */}
                    <div className="col-span-3">
                        <div className="bg-white rounded-lg shadow p-4 sticky top-24">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <Settings className="h-4 w-4" />
                                Thông Tin Công Ty
                            </h3>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Tên công ty
                                    </label>
                                    <input
                                        type="text"
                                        value={companySettings.company_name}
                                        onChange={(e) => setCompanySettings({ ...companySettings, company_name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Showroom
                                    </label>
                                    <input
                                        type="text"
                                        value={companySettings.company_showroom}
                                        onChange={(e) => setCompanySettings({ ...companySettings, company_showroom: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Nhà máy
                                    </label>
                                    <input
                                        type="text"
                                        value={companySettings.company_factory}
                                        onChange={(e) => setCompanySettings({ ...companySettings, company_factory: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Hotline
                                    </label>
                                    <input
                                        type="text"
                                        value={companySettings.company_hotline}
                                        onChange={(e) => setCompanySettings({ ...companySettings, company_hotline: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Website
                                    </label>
                                    <input
                                        type="text"
                                        value={companySettings.company_website}
                                        onChange={(e) => setCompanySettings({ ...companySettings, company_website: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <button
                                    onClick={handleUpdateCompanySettings}
                                    disabled={saving}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    <Save className="h-4 w-4" />
                                    {saving ? 'Đang lưu...' : 'Cập nhật'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main - PDF Preview */}
                    <div className="col-span-9">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="font-semibold mb-4 text-lg">Xem Trước PDF</h3>
                            <div className="border rounded-lg overflow-hidden bg-gray-50 p-4">
                                <div
                                    dangerouslySetInnerHTML={{ __html: generateExpensePDFHTML(pdfData) }}
                                    style={{
                                        transform: 'scale(0.75)',
                                        transformOrigin: 'top left',
                                        width: '133.33%'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
