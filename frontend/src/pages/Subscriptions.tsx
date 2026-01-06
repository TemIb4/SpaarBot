import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Calendar, X, Check, Edit2 } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useUserStore } from '../store/userStore'
import { apiService } from '../lib/api'
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO, getDay } from 'date-fns'

interface Subscription {
  id: number
  name: string
  amount: number
  icon: string
  next_billing_date: string
  billing_cycle: 'monthly' | 'yearly'
  currency: string
  status: string
}

interface SubscriptionForm {
  name: string
  amount: string
  icon: string
  billing_cycle: 'monthly' | 'yearly'
  next_billing_date: string
}

const Subscriptions = () => {
  const { t } = useLanguage()
  const { user } = useUserStore()
  const [subs, setSubs] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showDayModal, setShowDayModal] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const [form, setForm] = useState<SubscriptionForm>({
    name: '',
    amount: '',
    icon: '💳',
    billing_cycle: 'monthly',
    next_billing_date: format(new Date(), 'yyyy-MM-dd')
  })

  const [editForm, setEditForm] = useState<SubscriptionForm>({
    name: '',
    amount: '',
    icon: '💳',
    billing_cycle: 'monthly',
    next_billing_date: format(new Date(), 'yyyy-MM-dd')
  })

  const emojis = ['💳', '🎵', '🎬', '📺', '🎮', '☁️', '💪', '📱', '💻', '📚', '🍕', '🚗']

  const loadSubscriptions = async () => {
    if (!user?.telegram_id) return

    setLoading(true)
    try {
      const res = await apiService.subscriptions.list(user.telegram_id, 'active')
      setSubs(res.data || [])
    } catch (err) {
      console.error('Error loading subscriptions:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSubscriptions()
  }, [user?.telegram_id])

  const totalMonthly = subs.reduce((acc, curr) => {
    const amount = curr.billing_cycle === 'yearly' ? curr.amount / 12 : curr.amount
    return acc + amount
  }, 0)

  const validateAmount = (value: string): boolean => {
    const num = parseFloat(value)
    return !isNaN(num) && num > 0 && num <= 100000
  }

  // Get translated abbreviated day names
  const getDayNames = () => [
    t('dates.mon'),
    t('dates.tue'),
    t('dates.wed'),
    t('dates.thu'),
    t('dates.fri'),
    t('dates.sat'),
    t('dates.sun')
  ]

  const handleDelete = async (id: number) => {
    if (!user?.telegram_id) return

    try {
      await apiService.subscriptions.delete(id, user.telegram_id)
      setSubs(current => current.filter(sub => sub.id !== id))
      setExpandedId(null)
    } catch (err) {
      console.error('Error deleting subscription:', err)
    }
  }

  const handleAdd = async () => {
    if (!user?.telegram_id || !form.name || !form.amount || !validateAmount(form.amount)) {
      alert('Please enter a valid amount (0.01 - 100,000)')
      return
    }

    try {
      const res = await apiService.subscriptions.create({
        telegram_id: user.telegram_id,
        name: form.name,
        icon: form.icon,
        amount: parseFloat(form.amount),
        currency: 'EUR',
        billing_cycle: form.billing_cycle,
        next_billing_date: form.next_billing_date
      })

      setSubs(current => [...current, res.data])
      setShowAddModal(false)
      setForm({
        name: '',
        amount: '',
        icon: '💳',
        billing_cycle: 'monthly',
        next_billing_date: format(new Date(), 'yyyy-MM-dd')
      })
    } catch (err: any) {
      console.error('Error adding subscription:', err)
      alert(err.response?.data?.detail || 'Error adding subscription')
    }
  }

  const handleEdit = async () => {
    if (!user?.telegram_id || !selectedSub || !editForm.amount || !validateAmount(editForm.amount)) {
      alert('Please enter a valid amount (0.01 - 100,000)')
      return
    }

    try {
      const res = await apiService.subscriptions.update(selectedSub.id, {
        telegram_id: user.telegram_id,
        name: editForm.name,
        icon: editForm.icon,
        amount: parseFloat(editForm.amount),
        billing_cycle: editForm.billing_cycle,
        next_billing_date: editForm.next_billing_date
      })

      setSubs(current => current.map(sub => sub.id === selectedSub.id ? res.data : sub))
      setShowEditModal(false)
      setSelectedSub(null)
      setExpandedId(null)
    } catch (err: any) {
      console.error('Error updating subscription:', err)
      alert(err.response?.data?.detail || 'Error updating subscription')
    }
  }

  const openEditModal = (sub: Subscription) => {
    setSelectedSub(sub)
    setEditForm({
      name: sub.name,
      amount: sub.amount.toString(),
      icon: sub.icon,
      billing_cycle: sub.billing_cycle,
      next_billing_date: format(parseISO(sub.next_billing_date), 'yyyy-MM-dd')
    })
    setShowEditModal(true)
  }

  // Calendar functions
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  })

  // Get subscriptions on a specific day (with recurring logic)
  const subsOnDay = (day: Date) => {
    return subs.filter(sub => {
      const billingDate = parseISO(sub.next_billing_date)
      const billingDay = billingDate.getDate() // Day of month (1-31)
      const checkDay = day.getDate()

      // Check if the day of month matches
      if (billingDay === checkDay) {
        // For monthly subscriptions, any month after the billing date
        if (sub.billing_cycle === 'monthly') {
          return day >= billingDate
        }

        // For yearly subscriptions, check if same month and day
        if (sub.billing_cycle === 'yearly') {
          const billingMonth = billingDate.getMonth()
          const checkMonth = day.getMonth()
          if (billingMonth === checkMonth && day >= billingDate) {
            return true
          }
        }
      }

      // Handle edge case: if subscription is on 31st but current month has fewer days
      if (billingDay > checkDay) {
        const lastDayOfMonth = endOfMonth(day).getDate()
        if (checkDay === lastDayOfMonth && billingDay > lastDayOfMonth) {
          if (sub.billing_cycle === 'monthly') {
            return day >= billingDate
          }
          if (sub.billing_cycle === 'yearly') {
            const billingMonth = billingDate.getMonth()
            const checkMonth = day.getMonth()
            if (billingMonth === checkMonth && day >= billingDate) {
              return true
            }
          }
        }
      }

      return false
    })
  }

  const handleDayClick = (day: Date) => {
    const daySubs = subsOnDay(day)
    if (daySubs.length > 0) {
      setSelectedDay(day)
      setShowDayModal(true)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24 px-5 pt-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{t('subscriptions.title')}</h1>
        <p className="text-neutral-400 text-sm">{t('subscriptions.manage_recurring')}</p>
      </div>

      {/* Summary Card */}
      <div className="relative overflow-hidden rounded-3xl p-6 mb-8 bg-neutral-900 border border-white/5">
        <div className="absolute top-[-50%] right-[-20%] w-64 h-64 bg-indigo-600/20 rounded-full blur-[80px]" />

        <div className="relative z-10 flex justify-between items-center">
          <div>
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-1">
              {t('subscriptions.per_month')}
            </p>
            <h2 className="text-4xl font-bold text-white">€{totalMonthly.toFixed(2)}</h2>
            <p className="text-neutral-600 text-xs mt-1">
              {t('subscriptions.yearly_forecast')}: €{(totalMonthly * 12).toFixed(2)}
            </p>
          </div>
          <motion.button
            onClick={() => setShowCalendar(!showCalendar)}
            animate={{
              scale: [1, 1.05, 1],
              boxShadow: [
                '0 0 0 0 rgba(99, 102, 241, 0)',
                '0 0 0 8px rgba(99, 102, 241, 0.3)',
                '0 0 0 0 rgba(99, 102, 241, 0)'
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            whileTap={{ scale: 0.95 }}
            className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <Calendar size={24} className="text-indigo-400" />
          </motion.button>
        </div>
      </div>

      {/* Calendar View */}
      <AnimatePresence>
        {showCalendar && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="bg-neutral-900/50 rounded-3xl p-5 border border-white/5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">
                  {format(currentMonth, 'MMMM yyyy')}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
                    className="px-3 py-1 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="px-3 py-1 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors"
                  >
                    →
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {getDayNames().map(day => (
                  <div key={day} className="text-center text-xs text-neutral-500 font-medium py-2">
                    {day}
                  </div>
                ))}

                {/* Empty cells before the first day of month */}
                {Array.from({ length: (getDay(startOfMonth(currentMonth)) + 6) % 7 }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {daysInMonth.map(day => {
                  const subsHere = subsOnDay(day)
                  const isCurrentDay = isToday(day)
                  const hasSubscriptions = subsHere.length > 0

                  return (
                    <button
                      key={day.toString()}
                      onClick={() => handleDayClick(day)}
                      disabled={!hasSubscriptions}
                      className={`aspect-square p-1 rounded-lg border transition-all ${
                        isCurrentDay
                          ? 'border-indigo-500 bg-indigo-500/20 ring-2 ring-indigo-500/50'
                          : hasSubscriptions
                          ? 'border-purple-500/50 bg-purple-500/10 hover:bg-purple-500/20 cursor-pointer'
                          : 'border-white/5 cursor-default'
                      } ${!isSameMonth(day, currentMonth) ? 'opacity-30' : ''}`}
                    >
                      <div className="text-xs text-neutral-400 mb-0.5">{format(day, 'd')}</div>
                      {hasSubscriptions && (
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="text-[8px] text-purple-400 flex flex-wrap gap-0.5 justify-center">
                            {subsHere.slice(0, 3).map(sub => (
                              <span key={sub.id}>{sub.icon}</span>
                            ))}
                          </div>
                          {subsHere.length > 3 && (
                            <div className="text-[8px] text-purple-400">+{subsHere.length - 3}</div>
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Bar */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm font-bold text-neutral-300">
          {subs.length} {t('subscriptions.active')}
        </p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-purple-500/25"
        >
          <Plus size={16} /> {t('subscriptions.add_new')}
        </motion.button>
      </div>

      {/* Subscription List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-neutral-900/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : subs.length > 0 ? (
        <div className="space-y-3">
          <AnimatePresence>
            {subs.map((sub, i) => (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
                className="relative p-4 rounded-2xl bg-neutral-900/50 border border-white/5 hover:border-indigo-500/50 transition-all overflow-hidden cursor-pointer"
              >
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center text-2xl shadow-inner">
                      {sub.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{sub.name}</h3>
                      <p className="text-xs text-neutral-500">
                        {format(parseISO(sub.next_billing_date), 'dd MMM yyyy')}
                      </p>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {expandedId === sub.id ? (
                      <motion.div
                        key="buttons"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center gap-2"
                      >
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditModal(sub)
                          }}
                          className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors"
                        >
                          <Edit2 size={18} />
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(sub.id)
                          }}
                          className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                        >
                          <Trash2 size={18} />
                        </motion.button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="amount"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-right"
                      >
                        <p className="font-bold text-white">€{sub.amount.toFixed(2)}</p>
                        <p className="text-[10px] text-neutral-600 uppercase">
                          {sub.billing_cycle === 'monthly' ? t('subscriptions.monthly') : t('subscriptions.yearly')}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-12 text-neutral-600">
          <Calendar size={48} className="mx-auto mb-4 opacity-20" />
          <p>{t('subscriptions.no_subscriptions')}</p>
          <p className="text-sm mt-2">{t('subscriptions.add_first')}</p>
        </div>
      )}

      {/* Day Modal */}
      <AnimatePresence>
        {showDayModal && selectedDay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDayModal(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-neutral-900 rounded-3xl p-6 border border-white/10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">{format(selectedDay, 'MMMM d, yyyy')}</h2>
                  <p className="text-sm text-neutral-400 mt-1">{t('subscriptions.subscriptions_due')}: {subsOnDay(selectedDay).length}</p>
                </div>
                <button onClick={() => setShowDayModal(false)} className="text-neutral-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-3">
                {subsOnDay(selectedDay).map(sub => (
                  <div key={sub.id} className="flex items-center justify-between p-4 bg-neutral-800/50 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neutral-700 to-neutral-800 flex items-center justify-center text-xl">
                        {sub.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">{sub.name}</h3>
                        <p className="text-xs text-neutral-500">{sub.billing_cycle === 'monthly' ? t('subscriptions.monthly') : t('subscriptions.yearly')}</p>
                      </div>
                    </div>
                    <p className="font-bold text-white">€{sub.amount.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddModal(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-neutral-900 rounded-3xl p-6 pb-8 border border-white/10 shadow-2xl max-h-[70vh] overflow-y-auto"
              style={{ marginBottom: '80px' }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">{t('subscriptions.add_subscription')}</h2>
                <button onClick={() => setShowAddModal(false)} className="text-neutral-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Icon Selector */}
                <div>
                  <label className="block text-sm text-neutral-400 mb-2">{t('subscriptions.icon')}</label>
                  <div className="flex gap-2 flex-wrap">
                    {emojis.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => setForm({ ...form, icon: emoji })}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all ${
                          form.icon === emoji
                            ? 'bg-indigo-500 scale-110'
                            : 'bg-neutral-800 hover:bg-neutral-700'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm text-neutral-400 mb-2">{t('subscriptions.name')}</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Netflix"
                    className="w-full bg-neutral-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm text-neutral-400 mb-2">Amount (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="100000"
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    placeholder="12.99"
                    className="w-full bg-neutral-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-xs text-neutral-500 mt-1">Maximum: €100,000</p>
                </div>

                {/* Billing Cycle */}
                <div>
                  <label className="block text-sm text-neutral-400 mb-2">Billing Cycle</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setForm({ ...form, billing_cycle: 'monthly' })}
                      className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                        form.billing_cycle === 'monthly'
                          ? 'bg-indigo-500 text-white'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {t('subscriptions.monthly')}
                    </button>
                    <button
                      onClick={() => setForm({ ...form, billing_cycle: 'yearly' })}
                      className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                        form.billing_cycle === 'yearly'
                          ? 'bg-indigo-500 text-white'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {t('subscriptions.yearly')}
                    </button>
                  </div>
                </div>

                {/* Next Billing Date */}
                <div>
                  <label className="block text-sm text-neutral-400 mb-2">Next Billing Date</label>
                  <input
                    type="date"
                    value={form.next_billing_date}
                    onChange={e => setForm({ ...form, next_billing_date: e.target.value })}
                    className="w-full bg-neutral-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 rounded-xl bg-neutral-800 text-neutral-300 font-medium hover:bg-neutral-700 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleAdd}
                    disabled={!form.name || !form.amount || !validateAmount(form.amount)}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Check size={18} />
                    {t('common.add')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && selectedSub && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowEditModal(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-neutral-900 rounded-3xl p-6 pb-8 border border-white/10 shadow-2xl max-h-[70vh] overflow-y-auto"
              style={{ marginBottom: '80px' }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">{t('subscriptions.edit_subscription')}</h2>
                <button onClick={() => setShowEditModal(false)} className="text-neutral-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Icon Selector */}
                <div>
                  <label className="block text-sm text-neutral-400 mb-2">{t('subscriptions.icon')}</label>
                  <div className="flex gap-2 flex-wrap">
                    {emojis.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => setEditForm({ ...editForm, icon: emoji })}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all ${
                          editForm.icon === emoji
                            ? 'bg-indigo-500 scale-110'
                            : 'bg-neutral-800 hover:bg-neutral-700'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm text-neutral-400 mb-2">{t('subscriptions.subscription_name')}</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-neutral-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm text-neutral-400 mb-2">{t('subscriptions.amount')} (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="100000"
                    value={editForm.amount}
                    onChange={e => setEditForm({ ...editForm, amount: e.target.value })}
                    className="w-full bg-neutral-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-xs text-neutral-500 mt-1">{t('subscriptions.valid_amount')}</p>
                </div>

                {/* Billing Cycle */}
                <div>
                  <label className="block text-sm text-neutral-400 mb-2">{t('subscriptions.billing_cycle')}</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditForm({ ...editForm, billing_cycle: 'monthly' })}
                      className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                        editForm.billing_cycle === 'monthly'
                          ? 'bg-indigo-500 text-white'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {t('subscriptions.monthly')}
                    </button>
                    <button
                      onClick={() => setEditForm({ ...editForm, billing_cycle: 'yearly' })}
                      className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                        editForm.billing_cycle === 'yearly'
                          ? 'bg-indigo-500 text-white'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {t('subscriptions.yearly')}
                    </button>
                  </div>
                </div>

                {/* Next Billing Date */}
                <div>
                  <label className="block text-sm text-neutral-400 mb-2">{t('subscriptions.next_payment')}</label>
                  <input
                    type="date"
                    value={editForm.next_billing_date}
                    onChange={e => setEditForm({ ...editForm, next_billing_date: e.target.value })}
                    className="w-full bg-neutral-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-3 rounded-xl bg-neutral-800 text-neutral-300 font-medium hover:bg-neutral-700 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleEdit}
                    disabled={!editForm.amount || !validateAmount(editForm.amount)}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Check size={18} />
                    {t('common.save')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Subscriptions
