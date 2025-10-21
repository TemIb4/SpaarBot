import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Sparkles, TrendingUp, Lightbulb } from 'lucide-react'
import { premiumDesign } from '../config/premiumDesign'

const AIChat = () => {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: 'Hi! Ich bin dein AI Finanz-Assistent. Wie kann ich dir heute helfen?'
    }
  ])

  const handleSend = () => {
    if (!message.trim()) return

    setMessages([...messages, { role: 'user', content: message }])
    
    // Mock AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Das ist eine Test-Antwort. AI Integration kommt bald! 🤖'
      }])
    }, 1000)

    setMessage('')
  }

  const suggestions = [
    { icon: TrendingUp, text: 'Wo kann ich sparen?' },
    { icon: Lightbulb, text: 'Budget-Tipps' },
    { icon: Sparkles, text: 'Finanz-Analyse' },
  ]

  return (
    <div className="min-h-[calc(100vh-10rem)] py-8">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">AI Assistent</h1>
          <p className="text-neutral-400">
            Frag mich alles über deine Finanzen
          </p>
        </div>

        {/* Messages */}
        <div 
          className="rounded-3xl p-6 mb-6 min-h-[400px] max-h-[500px] overflow-y-auto"
          style={{
            background: premiumDesign.colors.neutral[900],
            border: `1px solid ${premiumDesign.colors.neutral[800]}`,
          }}
        >
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-[80%] p-4 rounded-2xl"
                  style={{
                    background: msg.role === 'user'
                      ? premiumDesign.colors.gradients.primary
                      : premiumDesign.glass.medium.background,
                    border: msg.role === 'assistant' 
                      ? premiumDesign.glass.medium.border 
                      : 'none',
                  }}
                >
                  <p className="text-white">{msg.content}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Suggestions */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMessage(suggestion.text)}
              className="p-4 rounded-xl text-left"
              style={{
                background: premiumDesign.glass.light.background,
                border: premiumDesign.glass.light.border,
              }}
            >
              <suggestion.icon size={20} className="text-primary-400 mb-2" />
              <p className="text-sm text-white font-medium">{suggestion.text}</p>
            </motion.button>
          ))}
        </div>

        {/* Input */}
        <div 
          className="flex items-center space-x-3 p-4 rounded-2xl"
          style={{
            background: premiumDesign.glass.medium.background,
            border: premiumDesign.glass.medium.border,
          }}
        >
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Schreib eine Nachricht..."
            className="flex-1 bg-transparent text-white outline-none placeholder-neutral-500"
          />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            className="p-3 rounded-xl"
            style={{
              background: premiumDesign.colors.gradients.primary,
            }}
          >
            <Send size={20} className="text-white" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}

export default AIChat