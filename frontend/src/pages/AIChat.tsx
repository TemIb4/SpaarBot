import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Send, Bot, Sparkles } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const AIChat = () => {
  const { t } = useLanguage()
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: t('ai.welcome') || 'Hello! I am your AI finance assistant.' }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = async () => {
    if (!input.trim()) return
    const newMsg: Message = { id: Date.now().toString(), role: 'user', content: input }
    setMessages(prev => [...prev, newMsg])
    setInput('')
    setIsTyping(true)
    setTimeout(() => {
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: "This is a demo response." }
      setMessages(prev => [...prev, aiMsg])
      setIsTyping(false)
    }, 1000)
  }

  return (
    // h-[calc(100dvh-6rem)] вычитает высоту навигации, чтобы чат не уходил под неё
    <div className="h-[calc(100dvh-8rem)] flex flex-col relative">

      {/* Header */}
      <div className="pt-6 pb-4 px-5 bg-black/80 backdrop-blur-md sticky top-0 z-20 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white">Finance AI</h1>
            <p className="text-xs text-green-400 flex items-center gap-1">Online</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 pb-4">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-neutral-800 text-white rounded-tr-none' : 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-tl-none'}`}>
              {msg.role === 'assistant' && <Sparkles size={14} className="mb-2 opacity-50" />}
              {msg.content}
            </div>
          </motion.div>
        ))}
        {isTyping && (
           <div className="flex gap-1 px-4 py-3 bg-neutral-900 rounded-2xl rounded-tl-none w-fit">
              <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce delay-75" />
              <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce delay-150" />
           </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area - теперь он часть потока flex, а не absolute, чтобы не перекрываться */}
      <div className="p-4 bg-black border-t border-white/5">
        <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..."
              className="flex-1 bg-neutral-900 border border-white/10 text-white px-5 py-3 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button onClick={handleSend} disabled={!input.trim()} className="p-3 bg-white text-black rounded-xl">
              <Send size={20} />
            </button>
        </div>
      </div>
    </div>
  )
}

export default AIChat