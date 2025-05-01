import { useState } from 'react'
import { QrScanner } from '@yudiel/react-qr-scanner'

interface ScannedItem {
  code: string
  manufacturer?: string
  model?: string
  description?: string
  specifications?: Record<string, string>
}

export default function ScanAndImport() {
  const [scannedData, setScannedData] = useState<ScannedItem | null>(null)
  const [isScanning, setIsScanning] = useState(false)

  const handleScan = async (data: string) => {
    setIsScanning(false)
    // Here we'll add the API call to look 