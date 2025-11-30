import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Calendar } from 'lucide-react'

interface Sub { id: number; name: string; cost: number; icon: string; date: string }

const Subscriptions = () => {
  const [subs, setSubs] = useState<Sub[]>([
    { id: 1, name: 'Netflix', cost: 12.99, icon: 'N', date: '2023-11-20' },
    { id: 2, name: 'Spotify', cost: 9.99, icon: 'S', date: '2023-11-22' },
    { id: 3, name: 'Adobe CC', cost: 24.50, icon: 'A', date: '2023-11-25' },
  ])

  const totalMonthly = subs.reduce((acc, curr) => acc + curr.cost, 0)

  const handleDelete = (id: number) => {
    setSubs(current => current.filter(sub => sub.id !== id))
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24 px-5 pt-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Subscriptions</h1>
        <p className="text-neutral-400 text-sm">Manage recurring payments</p>
      </div>

      {/* Summary Card */}
      <div className="relative overflow-hidden rounded-3xl p-6 mb-8 bg-neutral-900 border border-white/5">
        <div className="absolute top-[-50%] right-[-20%] w-64 h-64 bg-indigo-600/20 rounded-full blur-[80px]" />

        <div className="relative z-10 flex justify-between items-center">
          <div>
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-1">Monthly Total</p>
            <h2 className="text-4xl font-bold text-white">€{totalMonthly.toFixed(2)}</h2>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <Calendar size={24} className="text-indigo-400" />
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm font-bold text-neutral-300">{subs.length} Active Services</p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => alert('Add modal would open here')}
          className="px-4 py-2 bg-white text-black rounded-xl text-sm font-bold flex items-center gap-2"
        >
          <Plus size={16} /> Add New
        </motion.button>
      </div>

      {/* Subscription List */}
      <div className="space-y-3">
        <AnimatePresence>
          {subs.map((sub, i) => (
            <motion.div
              key={sub.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ delay: i * 0.1 }}
              className="group relative p-4 rounded-2xl bg-neutral-900/50 border border-white/5 hover:border-indigo-500/50 transition-colors overflow-hidden"
            >
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center text-xl font-bold shadow-inner">
                    {sub.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{sub.name}</h3>
                    <p className="text-xs text-neutral-500 flex items-center gap-1">
                       Next: {sub.date}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                   <p className="font-bold text-white">€{sub.cost}</p>
                   <p className="text-[10px] text-neutral-600 uppercase">Monthly</p>
                </div>
              </div>

              {/* Swipe Action Simulation (Delete Button) */}
              <button
                onClick={() => handleDelete(sub.id)}
                className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-red-500/10 text-red-500 rounded-lg"
              >
                <Trash2 size={18} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default Subscriptions