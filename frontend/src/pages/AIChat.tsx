/**
 * AI Chat Page with Optimized Animations
 */
import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { useTelegram } from '@/hooks/useTelegram'
import { usePageVisited } from '@/hooks/usePageVisited' // ✅ Добавили
import { Card } from '@/components/ui/Card'
import { AnimatedBackground } from '@/components/layout/AnimatedBackground'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export const AIChat: React.FC = () => {
  const { user } = useTelegram()
  const { shouldAnimate } = usePageVisited() // ✅ Добавили
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hallo! 👋 Ich bin dein AI-Finanzassistent. Wie kann ich dir heute helfen?',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // ✅ Настройки анимации
  const animationVariants = {
    hidden: { opacity: 0, y: shouldAnimate ? 20 : 0 },
    visible: { opacity: 1, y: 0 },
  }
  const animationDuration = shouldAnimate ? 0.2 : 0

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading || !user?.id) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await api.post('/ai/chat', {
        telegram_id: user.id,
        message: input,
      })

      const aiMessage: Message = {
        role: 'assistant',
        content: response.data.response || 'Entschuldigung, ich konnte keine Antwort generieren.',
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('AI Chat error:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: '❌ Fehler. Bitte versuche es erneut oder frage anders.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const quickQuestions = [
    '💡 Spar-Tipps',
    '📊 Ausgaben-Analyse',
    '🎯 Budget erstellen',
    '📈 Finanzplan',
  ]

  return (
    <div className="flex flex-col h-screen pb-24 relative">
      <AnimatedBackground />

      {/* Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={animationVariants}
        transition={{ duration: animationDuration }}
        className="relative p-6 shadow-lg z-10"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-lg"
            style={{ backgroundColor: 'var(--color-card)' }}
          >
            🤖
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              AI Assistent
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Powered by Groq AI
            </p>
          </div>
        </div>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 relative">
        {messages.map((message, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <Card
              padding="md"
              className="max-w-[80%] shadow-md"
              style={{
                background: message.role === 'user'
                  ? `linear-gradient(135deg, var(--color-primary), var(--color-accent))`
                  : 'var(--color-card)',
                color: 'var(--color-text)',
              }}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p
                className="text-xs mt-2"
                style={{
                  color: message.role === 'user'
                    ? 'rgba(255, 255, 255, 0.7)'
                    : 'var(--color-text-secondary)'
                }}
              >
                {message.timestamp.toLocaleTimeString('de-DE', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </Card>
          </motion.div>
        ))}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <Card padding="md" style={{ backgroundColor: 'var(--color-card)' }}>
              <div className="flex gap-2">
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--color-accent)', animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--color-accent)', animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--color-accent)', animationDelay: '300ms' }}></span>
              </div>
            </Card>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length === 1 && (
        <div className="px-4 pb-2 relative">
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            💬 Schnellfragen:
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {quickQuestions.map((question) => (
              <button
                key={question}
                onClick={() => setInput(question)}
                className="px-4 py-2 rounded-full text-sm whitespace-nowrap hover:shadow-lg transition-all"
                style={{
                  backgroundColor: 'var(--color-card)',
                  color: 'var(--color-text)',
                  border: '2px solid var(--color-border)',
                }}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 relative" style={{ backgroundColor: 'var(--color-card)', borderTop: '2px solid var(--color-border)' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Stelle eine Frage..."
            className="flex-1 p-4 rounded-full focus:outline-none transition-all"
            style={{
              backgroundColor: 'var(--color-card-hover)',
              color: 'var(--color-text)',
              border: '2px solid var(--color-border)',
            }}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-14 h-14 rounded-full flex items-center justify-center hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(135deg, var(--color-primary), var(--color-accent))`,
              color: 'var(--color-text)',
            }}
          >
            {isLoading ? '⏳' : '➤'}
          </button>
        </div>
      </div>
    </div>
  )
}