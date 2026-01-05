import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Copy, Trash2, Download } from 'lucide-react'
import { logger } from '../utils/logger'

const Logs = () => {
  const [logs, setLogs] = useState<any[]>([])
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = () => {
    const storedLogs = logger.getStoredLogs()
    setLogs(storedLogs)
  }

  const handleCopy = async () => {
    const success = await logger.copyLogsToClipboard()
    if (success) {
      alert('Логи скопированы в буфер обмена!')
    }
  }

  const handleClear = () => {
    if (confirm('Вы уверены что хотите очистить все логи?')) {
      logger.clearLogs()
      setLogs([])
    }
  }

  const handleDownload = () => {
    const logsText = logger.exportLogs()
    const blob = new Blob([logsText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `spaarbot-logs-${new Date().toISOString()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const filteredLogs = filter === 'all'
    ? logs
    : logs.filter(log => log.level === filter)

  const levelColors: Record<string, string> = {
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    warn: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
    debug: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24 px-5 pt-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Логи приложения</h1>
        <p className="text-neutral-400 text-sm">Отправьте эти логи разработчику для диагностики проблем</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={handleCopy}
          className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2"
        >
          <Copy size={18} />
          Копировать
        </button>
        <button
          onClick={handleDownload}
          className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2"
        >
          <Download size={18} />
          Скачать
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-3 bg-red-600 hover:bg-red-700 rounded-xl text-white font-medium transition-all flex items-center justify-center"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {['all', 'info', 'warn', 'error', 'debug'].map((level) => (
          <button
            key={level}
            onClick={() => setFilter(level)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              filter === level
                ? 'bg-indigo-600 text-white'
                : 'bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            {level.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Logs */}
      <div className="space-y-2">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-neutral-600">
            Логи отсутствуют
          </div>
        ) : (
          filteredLogs.reverse().map((log, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className={`p-4 rounded-xl border ${levelColors[log.level] || 'bg-neutral-900 text-neutral-300 border-neutral-800'}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-xs font-mono text-neutral-500">
                  {new Date(log.timestamp).toLocaleString('ru-RU')}
                </span>
                <span className="text-xs font-bold uppercase">
                  {log.level}
                </span>
              </div>
              <p className="text-sm font-medium mb-2">{log.message}</p>
              {log.data && (
                <pre className="text-xs bg-black/30 p-2 rounded overflow-x-auto">
                  {JSON.stringify(log.data, null, 2)}
                </pre>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}

export default Logs
