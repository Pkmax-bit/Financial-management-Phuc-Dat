import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

/**
 * Export data to Excel file
 * @param data Array of objects to export
 * @param filename Name of the file (without extension)
 */
export const exportToExcel = (data: any[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    saveAs(blob, `${filename}.xlsx`)
}

/**
 * Export data to CSV file
 * @param data Array of objects to export
 * @param filename Name of the file (without extension)
 */
export const exportToCSV = (data: any[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data)
    const csv = XLSX.utils.sheet_to_csv(ws)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })

    saveAs(blob, `${filename}.csv`)
}

/**
 * Export data to PDF (requires jsPDF)
 * Note: Install jspdf and jspdf-autotable first
 */
export const exportToPDF = async (data: any[], filename: string, title: string) => {
    const { jsPDF } = await import('jspdf')
    require('jspdf-autotable')

    const doc = new jsPDF()

    // Add title
    doc.setFontSize(16)
    doc.text(title, 14, 15)

    // Convert data to table format
    const headers = Object.keys(data[0] || {})
    const rows = data.map(item => Object.values(item))

        ; (doc as any).autoTable({
            head: [headers],
            body: rows,
            startY: 25,
        })

    doc.save(`${filename}.pdf`)
}
