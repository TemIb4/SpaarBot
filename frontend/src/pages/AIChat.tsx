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
    { id: '1', role: 'assistant', content: t('ai.welcome') || 'Hello! I am your AI finance assistant. How can I help you save money today?' }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Автоскролл к последнему сообщению
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = async () => {
    if (!input.trim()) return
    const newMsg: Message = { id: Date.now().toString(), role: 'user', content: input }
    setMessages(prev => [...prev, newMsg])
    setInput('')
    setIsTyping(true)

    // Имитация ответа (Mock)
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Based on your spending habits, you could save about €50/month by cooking at home on Fridays!"
      }
      setMessages(prev => [...prev, aiMsg])
      setIsTyping(false)
    }, 1500)
  }

  return (
    // Используем 100dvh для корректной высоты на мобильных браузерах (учитывает адресную строку)
    <div className="h-[100dvh] bg-black flex flex-col relative overflow-hidden">

      {/* Header */}
      <div className="pt-6 pb-4 px-5 border-b border-white/5 bg-black/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white">Finance AI</h1>
            <p className="text-xs text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/> Online
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      {/* pb-40 дает большой отступ снизу, чтобы контент не прятался за полем ввода */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-44 scroll-smooth">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-neutral-800 text-white rounded-tr-none'
                  : 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-purple-500/20 rounded-tl-none'
              }`}
            >
              {msg.role === 'assistant' && <Sparkles size={14} className="mb-2 opacity-50" />}
              {msg.content}
            </div>
          </motion.div>
        ))}

        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
             <div className="bg-neutral-900 px-4 py-3 rounded-2xl rounded-tl-none border border-white/5 flex gap-1">
                <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce delay-75" />
                <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce delay-150" />
             </div>
          </motion.div>
        )}
        {/* Невидимый блок для скролла */}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      {/* absolute bottom-20 поднимает поле ввода на ~80px вверх, чтобы не перекрывать нижнее меню навигации */}
      <div className="absolute bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/90 to-transparent z-30">

        {/* Quick Prompts */}
        {messages.length < 3 && (
            <div className="flex gap-2 overflow-x-auto mb-3 no-scrollbar pb-1">
            {['💸 Save Money', '📊 Analyze Budget', '📈 Investment Tips'].map(tag => (
                <button
                key={tag}
                onClick={() => setInput(tag)}
                className="whitespace-nowrap px-4 py-2 bg-neutral-900/90 border border-white/10 rounded-full text-xs text-neutral-300 hover:bg-neutral-800 active:scale-95 transition-transform"
                >
                {tag}
                </button>
            ))}
            </div>
        )}

        <div className="flex items-center gap-2">
            <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask AI anything..."
            className="flex-1 bg-neutral-800 border border-white/10 text-white px-5 py-3.5 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-neutral-500 shadow-xl"
            />
            <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-3.5 bg-white text-black rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-white/10"
            >
            <Send size={20} />
            </motion.button>
        </div>
      </div>
    </div>
  )
}

export default AIChat