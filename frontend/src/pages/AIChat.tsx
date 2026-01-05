import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, Sparkles, AlertCircle } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useUserStore } from '../store/userStore'
import { apiService } from '../lib/api'
import { logger } from '../utils/logger'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// Готовые промпты для быстрого доступа
const QUICK_PROMPTS = [
  { key: 'finance_analysis', icon: '📊' },
  { key: 'budget_tips', icon: '💡' },
  { key: 'savings_potential', icon: '💰' },
  { key: 'next_month_prediction', icon: '🔮' },
  { key: 'spending_habits', icon: '📈' },
  { key: 'category_analysis', icon: '🏷️' },
]

// Простая проверка на потенциально вредные промпты (дополнительная защита к backend)
const isPromptSafe = (prompt: string): boolean => {
  const lowerPrompt = prompt.toLowerCase()

  // Запрещенные фразы, которые могут быть вредными для пользователя
  const dangerousPatterns = [
    /invest all.*money/i,
    /sell.*everything/i,
    /take.*loan/i,
    /gambling/i,
    /casino/i,
    /cryptocurrency.*guaranteed/i,
    /get.*rich.*quick/i,
  ]

  return !dangerousPatterns.some(pattern => pattern.test(lowerPrompt))
}

const AIChat = () => {
  const { t, language } = useLanguage()
  const { user } = useUserStore()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: t('ai.welcome'),
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  // Обновляем приветствие при смене языка
  useEffect(() => {
    setMessages(prev => {
      const newMessages = [...prev]
      if (newMessages.length > 0 && newMessages[0].id === '1') {
        newMessages[0] = {
          ...newMessages[0],
          content: t('ai.welcome')
        }
      }
      return newMessages
    })
  }, [language])

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input.trim()

    if (!textToSend) return

    logger.info('[AIChat] Sending message', { user: user?.telegram_id, message: textToSend })

    if (!user?.telegram_id) {
      logger.error('[AIChat] User not authenticated')
      setError('User not authenticated')
      return
    }

    // Проверка безопасности промпта
    if (!isPromptSafe(textToSend)) {
      logger.warn('[AIChat] Unsafe prompt detected', { message: textToSend })
      setError('This type of question is not appropriate for financial advice')
      return
    }

    // Добавляем сообщение пользователя
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setError(null)
    setIsTyping(true)

    try {
      logger.info('[AIChat] Calling AI API', { telegram_id: user.telegram_id, language })

      // Отправляем запрос к AI API
      const response = await apiService.ai.query({
        telegram_id: user.telegram_id,
        message: textToSend,
        language: language
      })

      logger.info('[AIChat] AI response received', { response: response.data })

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response || response.data.message || 'Sorry, I could not process that.',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMsg])
    } catch (err: any) {
      logger.error('[AIChat] AI Error', {
        error: err.message,
        response: err.response?.data,
        status: err.response?.status
      })
      setError(t('ai.error_sending'))

      // Убираем сообщение пользователя при ошибке
      setMessages(prev => prev.filter(m => m.id !== userMsg.id))
    } finally {
      setIsTyping(false)
    }
  }

  const handleQuickPrompt = (promptKey: string) => {
    const promptText = t(`ai.${promptKey}`)
    handleSend(promptText)
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col" style={{
      paddingTop: 'var(--header-total-height)',
      paddingBottom: 'var(--bottom-nav-height)'
    }}>
      {/* Header - Fixed */}
      <div className="flex-shrink-0 pt-4 pb-3 px-5 bg-gradient-to-b from-black via-black to-transparent backdrop-blur-md border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center relative">
              <Bot size={24} className="text-white" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-black" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white">{t('ai.title')}</h1>
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                {t('ai.online')}
              </p>
            </div>
          </div>
          <div className="text-xs text-neutral-500">{t('ai.powered_by')}</div>
        </div>
      </div>

      {/* Quick Prompts - Fixed */}
      <div className="flex-shrink-0 px-5 py-3 bg-black/50 border-b border-white/5">
        <p className="text-xs text-neutral-400 mb-2 uppercase tracking-wider">{t('ai.suggestions')}</p>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {QUICK_PROMPTS.map((prompt) => (
            <motion.button
              key={prompt.key}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleQuickPrompt(prompt.key)}
              disabled={isTyping}
              className="flex-shrink-0 px-3 py-2 rounded-xl bg-neutral-900 border border-white/10 hover:border-purple-500/50 transition-all text-xs text-neutral-300 hover:text-white flex items-center gap-2 disabled:opacity-50"
            >
              <span>{prompt.icon}</span>
              <span className="whitespace-nowrap">{t(`ai.${prompt.key}`)}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Error Banner - Fixed */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex-shrink-0 mx-5 mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2"
          >
            <AlertCircle className="text-rose-400 flex-shrink-0" size={16} />
            <p className="text-rose-400 text-xs">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-rose-400 hover:text-rose-300 text-xs"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages - Scrollable */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="space-y-4 pb-4">
          {messages.map((msg, index) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-neutral-800 text-white rounded-tr-md'
                    : 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-tl-md shadow-lg shadow-purple-500/20'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2 opacity-70">
                    <Sparkles size={14} />
                    <span className="text-xs">AI Assistant</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <div className={`mt-2 text-[10px] ${msg.role === 'user' ? 'text-neutral-500' : 'text-white/50'}`}>
                  {msg.timestamp.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Typing Indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex justify-start"
              >
                <div className="flex gap-1 px-4 py-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl rounded-tl-md shadow-lg shadow-purple-500/20">
                  <span className="w-2 h-2 bg-white/70 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <span className="w-2 h-2 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Fixed */}
      <div className="flex-shrink-0 p-4 bg-black/90 backdrop-blur-xl border-t border-white/10">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-neutral-900 border border-white/10 rounded-2xl focus-within:border-purple-500/50 transition-colors overflow-hidden">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder={t('ai.placeholder')}
              disabled={isTyping}
              rows={1}
              className="w-full bg-transparent text-white px-5 py-3 focus:outline-none resize-none disabled:opacity-50"
              style={{
                minHeight: '48px',
                maxHeight: '120px',
              }}
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25 transition-all hover:shadow-purple-500/40"
          >
            <Send size={20} />
          </motion.button>
        </div>
        <p className="text-[10px] text-neutral-600 mt-2 text-center">
          AI can make mistakes. Verify important financial information.
        </p>
      </div>
    </div>
  )
}

export default AIChat
