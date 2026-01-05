/**
 * Logger utility for debugging
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  data?: any
}

class Logger {
  private logs: LogEntry[] = []
  private maxLogs = 100

  private formatTimestamp(): string {
    const now = new Date()
    return now.toISOString()
  }

  private addLog(level: LogLevel, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      message,
      data
    }

    this.logs.push(entry)

    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // Store in localStorage for persistence
    try {
      localStorage.setItem('spaarbot-logs', JSON.stringify(this.logs))
    } catch (e) {
      // If localStorage is full, clear old logs
      this.logs = this.logs.slice(-50)
      localStorage.setItem('spaarbot-logs', JSON.stringify(this.logs))
    }

    // Console output with colors
    const styles: Record<LogLevel, string> = {
      info: 'color: #3b82f6',
      warn: 'color: #f59e0b',
      error: 'color: #ef4444',
      debug: 'color: #8b5cf6'
    }

    console.log(
      `%c[${entry.timestamp}] [${level.toUpperCase()}] ${message}`,
      styles[level],
      data || ''
    )
  }

  info(message: string, data?: any) {
    this.addLog('info', message, data)
  }

  warn(message: string, data?: any) {
    this.addLog('warn', message, data)
  }

  error(message: string, data?: any) {
    this.addLog('error', message, data)
  }

  debug(message: string, data?: any) {
    this.addLog('debug', message, data)
  }

  // Get all logs
  getLogs(): LogEntry[] {
    return this.logs
  }

  // Get logs from localStorage
  getStoredLogs(): LogEntry[] {
    try {
      const stored = localStorage.getItem('spaarbot-logs')
      return stored ? JSON.parse(stored) : []
    } catch (e) {
      return []
    }
  }

  // Export logs as text for sharing
  exportLogs(): string {
    const allLogs = this.getStoredLogs()
    return allLogs
      .map(log => {
        const dataStr = log.data ? ` | Data: ${JSON.stringify(log.data)}` : ''
        return `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}${dataStr}`
      })
      .join('\n')
  }

  // Clear all logs
  clearLogs() {
    this.logs = []
    localStorage.removeItem('spaarbot-logs')
    console.log('%c[LOGGER] Logs cleared', 'color: #10b981')
  }

  // Copy logs to clipboard
  async copyLogsToClipboard(): Promise<boolean> {
    try {
      const logs = this.exportLogs()
      await navigator.clipboard.writeText(logs)
      this.info('Logs copied to clipboard')
      return true
    } catch (e) {
      this.error('Failed to copy logs to clipboard', e)
      return false
    }
  }
}

export const logger = new Logger()

// Log initialization
logger.info('Logger initialized')

// Global error handler
window.addEventListener('error', (event) => {
  logger.error('Uncaught error', {
    message: event.error?.message || event.message,
    stack: event.error?.stack,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  })
})

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection', {
    reason: event.reason,
    promise: event.promise
  })
})
