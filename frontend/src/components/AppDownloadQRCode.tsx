'use client'

import { QRCodeSVG } from 'qrcode.react'

interface AppDownloadQRCodeProps {
  value: string
  size?: number
}

export default function AppDownloadQRCode({ value, size = 200 }: AppDownloadQRCodeProps) {
  return (
    <QRCodeSVG
      value={value}
      size={size}
      level="H"
      includeMargin={true}
    />
  )
}






