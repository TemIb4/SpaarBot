import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useUserStore } from '../store/userStore'
import { api } from '../lib/api'

interface CSVImportProps {
  onClose: () => void
  onSuccess?: () => void
}

interface ImportResult {
  success: boolean
  imported: number
  duplicates_skipped: number
  errors: number
  details?: any[]
  error?: string
}

const BANK_FORMATS = [
  { value: 'generic', label: 'Generic CSV', icon: '📄' },
  { value: 'deutsche_bank', label: 'Deutsche Bank', icon: '🏦' },
  { value: 'sparkasse', label: 'Sparkasse', icon: '🔴' },
  { value: 'n26', label: 'N26', icon: '💳' },
  { value: 'revolut', label: 'Revolut', icon: '💸' },
  { value: 'commerzbank', label: 'Commerzbank', icon: '🟡' },
]

export const CSVImport = ({ onClose, onSuccess }: CSVImportProps) => {
  const { t } = useLanguage()
  const { user } = useUserStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [bankFormat, setBankFormat] = useState('generic')
  const [autoCategorize, setAutoCategorize] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file')
        return
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File too large (max 5MB)')
        return
      }
      setFile(selectedFile)
      setError(null)
      setResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file || !user?.telegram_id) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('csv_file', file)
      formData.append('telegram_id', user.telegram_id.toString())
      formData.append('bank_format', bankFormat)
      formData.append('auto_categorize', autoCategorize.toString())

      const response = await api.post('/api/v1/bank/import-csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setResult(response.data)
      if (response.data.success && onSuccess) {
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 2000)
      }
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.response?.data?.detail || 'Failed to import CSV')
    } finally {
      setUploading(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-md bg-neutral-900 rounded-3xl border border-white/10 overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                <Upload className="text-indigo-400" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{t('csv.import_title')}</h2>
                <p className="text-xs text-neutral-500">{t('csv.import_subtitle')}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/5 transition-colors"
            >
              <X size={20} className="text-neutral-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-5">
            {/* File Upload Area */}
            {!result && (
              <>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative border-2 border-dashed border-white/10 rounded-2xl p-8 hover:border-indigo-500/50 transition-all cursor-pointer group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-3 text-center">
                    {file ? (
                      <>
                        <FileText size={40} className="text-indigo-400" />
                        <div>
                          <p className="text-sm font-semibold text-white">{file.name}</p>
                          <p className="text-xs text-neutral-500">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setFile(null)
                          }}
                          className="text-xs text-rose-400 hover:text-rose-300"
                        >
                          {t('common.remove')}
                        </button>
                      </>
                    ) : (
                      <>
                        <Upload size={40} className="text-neutral-600 group-hover:text-indigo-400 transition-colors" />
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {t('csv.click_to_upload')}
                          </p>
                          <p className="text-xs text-neutral-500">CSV (max 5MB)</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Bank Format Selection */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-wider">
                    {t('csv.bank_format')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {BANK_FORMATS.map((format) => (
                      <button
                        key={format.value}
                        onClick={() => setBankFormat(format.value)}
                        className={`p-3 rounded-xl border transition-all text-left ${
                          bankFormat === format.value
                            ? 'bg-indigo-500/20 border-indigo-500/50 text-white'
                            : 'bg-neutral-800/50 border-white/5 text-neutral-400 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{format.icon}</span>
                          <span className="text-xs font-medium">{format.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Auto-categorize Option */}
                <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-800/50 border border-white/5 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      ✨
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{t('csv.auto_categorize')}</p>
                      <p className="text-xs text-neutral-500">{t('csv.ai_powered')}</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoCategorize}
                    onChange={(e) => setAutoCategorize(e.target.checked)}
                    className="w-5 h-5 rounded bg-neutral-700 border-neutral-600 text-indigo-500 focus:ring-indigo-500"
                  />
                </label>

                {/* Error Display */}
                {error && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2">
                    <AlertCircle className="text-rose-400 flex-shrink-0" size={16} />
                    <p className="text-xs text-rose-400">{error}</p>
                  </div>
                )}

                {/* Upload Button */}
                <button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      {t('csv.uploading')}
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      {t('csv.import_button')}
                    </>
                  )}
                </button>
              </>
            )}

            {/* Result Display */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex flex-col items-center gap-3 py-6">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    result.success ? 'bg-emerald-500/20' : 'bg-rose-500/20'
                  }`}>
                    {result.success ? (
                      <CheckCircle className="text-emerald-400" size={32} />
                    ) : (
                      <AlertCircle className="text-rose-400" size={32} />
                    )}
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-white mb-1">
                      {result.success ? t('csv.import_success') : t('csv.import_failed')}
                    </h3>
                    {result.error && (
                      <p className="text-sm text-rose-400">{result.error}</p>
                    )}
                  </div>
                </div>

                {result.success && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                      <p className="text-2xl font-bold text-emerald-400">{result.imported}</p>
                      <p className="text-xs text-neutral-500">{t('csv.imported')}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
                      <p className="text-2xl font-bold text-yellow-400">{result.duplicates_skipped}</p>
                      <p className="text-xs text-neutral-500">{t('csv.skipped')}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
                      <p className="text-2xl font-bold text-rose-400">{result.errors}</p>
                      <p className="text-xs text-neutral-500">{t('csv.errors')}</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={onClose}
                  className="w-full py-3 px-4 rounded-xl bg-neutral-800 text-white font-semibold hover:bg-neutral-700 transition-all"
                >
                  {t('common.close')}
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
