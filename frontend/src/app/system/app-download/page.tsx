'use client'

import { useState, useEffect } from 'react'
import { Download, Smartphone } from 'lucide-react'
import { useRoleBasedAuth } from '@/hooks/useRoleBasedAuth'

export default function AppDownloadAdminPage() {
  const { isAdmin, isLoading: authLoading } = useRoleBasedAuth()

  const [appVersion, setAppVersion] = useState<{
    version_name: string
    download_url: string | null
    file_size: number | null
    release_notes: string | null
  } | null>(null)
  const [loadingVersion, setLoadingVersion] = useState(true)
  const [downloadUrlInput, setDownloadUrlInput] = useState<string>('')
  const [savingDownloadUrl, setSavingDownloadUrl] = useState(false)

  useEffect(() => {
    const fetchLatestVersion = async () => {
      try {
        setLoadingVersion(true)
        const endpoint = '/api/app/latest'
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
        if (!response.ok) throw new Error(`Failed to fetch app version: ${response.status}`)
        const data = await response.json()
        setAppVersion({
          version_name: data.version_name || '1.0',
          download_url: data.download_url || null,
          file_size: data.file_size || null,
          release_notes: data.release_notes || null,
        })
        if (data.download_url) {
          setDownloadUrlInput(data.download_url)
        }
      } catch (error) {
        console.error('Error fetching app version:', error)
        setAppVersion({
          version_name: '1.0',
          download_url: null,
          file_size: null,
          release_notes: null,
        })
      } finally {
        setLoadingVersion(false)
      }
    }
    fetchLatestVersion()
  }, [])

  const handleSaveDownloadUrl = async () => {
    if (!downloadUrlInput) {
      alert('Vui lòng nhập link tải app (Google Drive hoặc URL khác).')
      return
    }

    try {
      setSavingDownloadUrl(true)

      const backendApiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'https://financial-management-backend-3m78.onrender.com'

      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
      if (!token) {
        alert('Không tìm thấy token đăng nhập. Vui lòng đăng nhập lại bằng tài khoản admin.')
        return
      }

      const response = await fetch(`${backendApiUrl}/api/app-updates/latest/download-url`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ download_url: downloadUrlInput }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to update download URL:', errorText)
        alert('Không thể cập nhật link tải app. Vui lòng thử lại hoặc kiểm tra log server.')
        return
      }

      const data = await response.json()
      const updatedUrl =
        data?.version?.apk_file_url || data?.version?.download_url || downloadUrlInput

      setAppVersion(prev =>
        prev
          ? {
              ...prev,
              download_url: updatedUrl,
            }
          : {
              version_name: '1.0',
              download_url: updatedUrl,
              file_size: null,
              release_notes: null,
            },
      )

      alert('Đã cập nhật link tải app thành công.')
    } catch (error) {
      console.error('Error updating download URL:', error)
      alert('Có lỗi xảy ra khi cập nhật link tải app.')
    } finally {
      setSavingDownloadUrl(false)
    }
  }

  const handleClearDownloadUrl = async () => {
    if (!appVersion?.download_url) {
      alert('Hiện tại chưa có link tải app trong database.')
      return
    }

    if (
      !confirm(
        'Bạn có chắc muốn xóa link tải app hiện tại? Người dùng sẽ không tải được app cho đến khi bạn nhập link mới.',
      )
    ) {
      return
    }

    try {
      setSavingDownloadUrl(true)

      const backendApiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'https://financial-management-backend-3m78.onrender.com'

      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
      if (!token) {
        alert('Không tìm thấy token đăng nhập. Vui lòng đăng nhập lại bằng tài khoản admin.')
        return
      }

      const response = await fetch(`${backendApiUrl}/api/app-updates/latest/download-url`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ download_url: '' }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to clear download URL:', errorText)
        alert('Không thể xóa link tải app. Vui lòng thử lại hoặc kiểm tra log server.')
        return
      }

      setAppVersion(prev =>
        prev
          ? {
              ...prev,
              download_url: null,
            }
          : {
              version_name: '1.0',
              download_url: null,
              file_size: null,
              release_notes: null,
            },
      )
      setDownloadUrlInput('')

      alert('Đã xóa link tải app hiện tại.')
    } catch (error) {
      console.error('Error clearing download URL:', error)
      alert('Có lỗi xảy ra khi xóa link tải app.')
    } finally {
      setSavingDownloadUrl(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-600">Đang kiểm tra phân quyền...</p>
      </div>
    )
  }

  if (!isAdmin()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-md w-full text-center">
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Không có quyền truy cập</h1>
          <p className="text-sm text-gray-600">
            Chỉ quản trị viên mới có thể quản lý link tải App Android. Vui lòng liên hệ quản trị viên nếu
            bạn cần cập nhật link.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center space-x-2">
            <Smartphone className="h-6 w-6 text-amber-600" />
            <span>Quản lý link tải App Android</span>
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            Chỉ quản trị viên mới thấy trang này. Bạn có thể tạo / sửa / xóa link tải APK (ví dụ Google Drive
            direct link). Người dùng sẽ tải app theo link này trên trang Cài đặt.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link tải APK hiện tại (Google Drive hoặc URL khác)
              </label>
              <input
                type="text"
                value={downloadUrlInput}
                onChange={e => setDownloadUrlInput(e.target.value)}
                placeholder="https://drive.google.com/uc?export=download&id=..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Gợi ý: dùng link trực tiếp (direct download). Ví dụ với Google Drive dùng dạng{' '}
                <code className="bg-gray-100 px-1 py-0.5 rounded">
                  https://drive.google.com/uc?export=download&amp;id=FILE_ID
                </code>
                . Bạn có thể copy từ link chia sẻ của Google Drive rồi chuyển sang dạng direct download.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
                disabled={loadingVersion}
              >
                {loadingVersion ? 'Đang tải...' : 'Tải lại từ server'}
              </button>
              <button
                type="button"
                onClick={handleSaveDownloadUrl}
                disabled={savingDownloadUrl}
                className={`px-4 py-2 rounded-lg text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 transition-colors ${
                  savingDownloadUrl ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {savingDownloadUrl ? 'Đang lưu...' : 'Lưu link tải mới'}
              </button>
              <button
                type="button"
                onClick={handleClearDownloadUrl}
                disabled={savingDownloadUrl || !appVersion?.download_url}
                className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                  appVersion?.download_url
                    ? 'border-red-500 text-red-600 hover:bg-red-50'
                    : 'border-gray-200 text-gray-400 cursor-not-allowed'
                } transition-colors`}
              >
                Xóa link hiện tại
              </button>
            </div>

            {appVersion && (
              <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
                <h2 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                  <Download className="h-4 w-4 text-gray-700" />
                  <span>Thông tin phiên bản hiện tại</span>
                </h2>
                <p>
                  <span className="font-medium">Version:</span> {appVersion.version_name}
                </p>
                {appVersion.file_size && (
                  <p>
                    <span className="font-medium">Kích thước:</span>{' '}
                    ~{(appVersion.file_size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                )}
                {appVersion.release_notes && (
                  <p>
                    <span className="font-medium">Ghi chú:</span> {appVersion.release_notes}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}







