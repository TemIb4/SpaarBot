import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, TrendingUp, Lightbulb, PieChart } from 'lucide-react'
import { premiumDesign } from '../config/premiumDesign'
import { useLanguage } from '../contexts/LanguageContext'
import { useUserStore } from '../store/userStore'
import { api } from '../lib/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const AIChat: React.FC = () => {
  const { t, language } = useLanguage()
  const { user } = useUserStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Загрузка истории чата при монтировании
  useEffect(() => {
    loadChatHistory()
  }, [])

  // Автоскролл к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadChatHistory = () => {
    // Загрузка из localStorage
    const saved = localStorage.getItem('spaarbot-chat-history')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setMessages(parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        })))
        return
      } catch (e) {
        console.error('Failed to load chat history:', e)
      }
    }

    // Приветственное сообщение на выбранном языке
    const greetings = {
      de: `Hi! Ich bin dein AI Finanz-Assistent. Ich kann dir helfen bei:

• Ausgabenanalyse und Spartipps
• Budget-Planung und Optimierung
• Finanzielle Ziele und Strategien
• Kategorisierung von Transaktionen

Wie kann ich dir heute helfen?`,
      en: `Hi! I'm your AI Finance Assistant. I can help you with:

• Expense analysis and saving tips
• Budget planning and optimization
• Financial goals and strategies
• Transaction categorization

How can I help you today?`,
      ru: `Привет! Я твой AI финансовый ассистент. Я могу помочь с:

• Анализом расходов и советами по экономии
• Планированием и оптимизацией бюджета
• Финансовыми целями и стратегиями
• Категоризацией транзакций

Как я могу помочь тебе сегодня?`,
      uk: `Привіт! Я твій AI фінансовий асистент. Я можу допомогти з:

• Аналізом витрат та порадами по заощадженню
• Плануванням та оптимізацією бюджету
• Фінансовими цілями та стратегіями
• Категоризацією транзакцій

Як я можу допомогти тобі сьогодні?`
    }

    const greeting: Message = {
      id: 'welcome',
      role: 'assistant',
      content: greetings[language as keyof typeof greetings] || greetings.de,
      timestamp: new Date()
    }

    setMessages([greeting])
    saveChatHistory([greeting])
  }

  const saveChatHistory = (msgs: Message[]) => {
    localStorage.setItem('spaarbot-chat-history', JSON.stringify(msgs))
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    saveChatHistory(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      // Отправка на backend с историей и языком
      const response = await api.post('/api/v1/ai', {
        message: userMessage.content,
        history: messages.slice(-5).map(m => ({ // Последние 5 сообщений для контекста
          role: m.role,
          content: m.content
        })),
        language: language,
        user_id: user?.telegram_id
      })

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response || response.data.message,
        timestamp: new Date()
      }

      const finalMessages = [...updatedMessages, assistantMessage]
      setMessages(finalMessages)
      saveChatHistory(finalMessages)

    } catch (error) {
      console.error('AI Chat error:', error)

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: t('common.error') + ': ' + (error as any).message,
        timestamp: new Date()
      }

      const finalMessages = [...updatedMessages, errorMessage]
      setMessages(finalMessages)
      saveChatHistory(finalMessages)
    } finally {
      setLoading(false)
    }
  }

  const quickQuestions = [
    { icon: TrendingUp, text: t('ai.where_save'), query: language === 'de' ? 'Wo kann ich sparen?' : 'Where can I save?' },
    { icon: Lightbulb, text: t('ai.budget_tips'), query: language === 'de' ? 'Budget-Tipps' : 'Budget tips' },
    { icon: PieChart, text: t('ai.finance_analysis'), query: language === 'de' ? 'Finanz-Analyse' : 'Finance analysis' },
  ]

  return (
    <div className="min-h-[calc(100vh-10rem)] flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="p-4 border-b"
        style={{ borderColor: premiumDesign.colors.neutral[800] }}
      >
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
          {t('ai.title')}
        </h1>
        <p className="text-sm text-neutral-400">
          {t('ai.powered_by')}
        </p>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white'
                    : 'text-white'
                }`}
                style={
                  message.role === 'assistant'
                    ? {
                        background: premiumDesign.glass.medium.background,
                        border: premiumDesign.glass.medium.border,
                      }
                    : {}
                }
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-60 mt-2">
                  {message.timestamp.toLocaleTimeString(language, {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div
              className="rounded-2xl px-4 py-3"
              style={{
                background: premiumDesign.glass.medium.background,
                border: premiumDesign.glass.medium.border,
              }}
            >
              <div className="flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-primary-500 animate-bounce delay-100" />
                <div className="w-2 h-2 rounded-full bg-primary-500 animate-bounce delay-200" />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length <= 1 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="px-4 pb-4"
        >
          <p className="text-sm text-neutral-400 mb-3">{t('ai.quick_questions')}</p>
          <div className="grid grid-cols-3 gap-2">
            {quickQuestions.map((q, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setInput(q.query)
                  setTimeout(() => sendMessage(), 100)
                }}
                className="p-3 rounded-xl text-xs flex flex-col items-center gap-2"
                style={{
                  background: premiumDesign.glass.light.background,
                  border: premiumDesign.glass.light.border,
                }}
              >
                <q.icon size={20} className="text-primary-400" />
                <span className="text-neutral-300 text-center leading-tight">{q.text}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Input */}
      <div className="p-4 border-t" style={{ borderColor: premiumDesign.colors.neutral[800] }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={t('ai.write_message')}
            className="flex-1 px-4 py-3 rounded-xl text-white placeholder-neutral-500 focus:outline-none"
            style={{
              background: premiumDesign.glass.medium.background,
              border: premiumDesign.glass.medium.border,
            }}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="px-4 py-3 rounded-xl text-white disabled:opacity-50"
            style={{
              background: premiumDesign.colors.gradients.primary,
            }}
          >
            <Send size={20} />
          </motion.button>
        </div>
      </div>
    </div>
  )
}

export default AIChat