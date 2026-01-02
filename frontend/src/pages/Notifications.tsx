import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, BellOff, Check, TrendingDown, Calendar,
  AlertCircle, Info, Trash2, CheckCheck
} from 'lucide-react'
import { premiumDesign } from '../config/premiumDesign'
import { api } from '../lib/api'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { useLanguage } from '../contexts/LanguageContext'

interface Notification {
  id: number
  type: 'expense' | 'subscription' | 'alert' | 'info'
  title: string
  message: string
  read: boolean
  created_at: string
  action?: {
    label: string
    url: string
  }
}

const Notifications: React.FC = () => {
  const { t } = useLanguage()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const response = await api.get('/api/v1/notifications')
      setNotifications(response.data)
    } catch (error) {
      // Mock data для демонстрации
      setNotifications([
        {
          id: 1,
          type: 'subscription',
          title: t('notifications.spotify_payment'),
          message: t('notifications.spotify_payment_desc'),
          read: false,
          created_at: new Date().toISOString(),
          action: {
            label: t('notifications.view_subscriptions'),
            url: '/subscriptions'
          }
        },
        {
          id: 2,
          type: 'alert',
          title: t('notifications.budget_warning'),
          message: t('notifications.budget_warning_desc'),
          read: false,
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 3,
          type: 'info',
          title: t('notifications.new_ai_feature'),
          message: t('notifications.new_ai_feature_desc'),
          read: true,
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: number) => {
    try {
      await api.post(`/api/v1/notifications/${id}/read`)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
    } catch (error) {
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.post('/api/v1/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (error) {
    }
  }

  const deleteNotification = async (id: number) => {
    try {
      await api.delete(`/api/v1/notifications/${id}`)
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (error) {
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'expense':
        return TrendingDown
      case 'subscription':
        return Calendar
      case 'alert':
        return AlertCircle
      case 'info':
        return Info
      default:
        return Bell
    }
  }

  const getColor = (type: string) => {
    switch (type) {
      case 'expense':
        return premiumDesign.colors.accent[500]
      case 'subscription':
        return premiumDesign.colors.warning[500]
      case 'alert':
        return premiumDesign.colors.danger[500]
      case 'info':
        return premiumDesign.colors.primary[500]
      default:
        return premiumDesign.colors.neutral[500]
    }
  }

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="min-h-[calc(100vh-10rem)] py-8">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{t('notifications.title')}</h1>
            {unreadCount > 0 && (
              <p className="text-neutral-400">
                {unreadCount} {t('notifications.unread_count')}
              </p>
            )}
          </div>

          {unreadCount > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={markAllAsRead}
              className="px-4 py-2 rounded-xl font-semibold text-white flex items-center space-x-2"
              style={{
                background: premiumDesign.glass.medium.background,
                border: premiumDesign.glass.medium.border,
              }}
            >
              <CheckCheck size={18} />
              <span>{t('notifications.mark_all_read')}</span>
            </motion.button>
          )}
        </div>

        {/* Filter Tabs */}
        <div
          className="inline-flex p-1 rounded-2xl mb-6"
          style={{
            background: premiumDesign.glass.medium.background,
            border: premiumDesign.glass.medium.border,
          }}
        >
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter('all')}
            className="px-6 py-2 rounded-xl font-semibold transition-all"
            style={{
              background: filter === 'all'
                ? premiumDesign.colors.gradients.primary
                : 'transparent',
              color: filter === 'all' ? '#fff' : premiumDesign.colors.neutral[400],
            }}
          >
            {t('notifications.all')} ({notifications.length})
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter('unread')}
            className="px-6 py-2 rounded-xl font-semibold transition-all relative"
            style={{
              background: filter === 'unread'
                ? premiumDesign.colors.gradients.primary
                : 'transparent',
              color: filter === 'unread' ? '#fff' : premiumDesign.colors.neutral[400],
            }}
          >
            {t('notifications.unread')} ({unreadCount})
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse"
                style={{ background: premiumDesign.colors.danger[500] }}
              />
            )}
          </motion.button>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-16"
          >
            <div
              className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center text-4xl"
              style={{
                background: premiumDesign.glass.medium.background,
                border: premiumDesign.glass.medium.border,
              }}
            >
              {filter === 'unread' ? <BellOff size={40} className="text-neutral-600" /> : <Bell size={40} className="text-neutral-600" />}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {filter === 'unread' ? t('notifications.no_unread') : t('notifications.no_notifications')}
            </h3>
            <p className="text-neutral-400">
              {filter === 'unread'
                ? t('notifications.all_read')
                : t('notifications.no_notifications_desc')}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredNotifications.map((notification, index) => {
                const Icon = getIcon(notification.type)
                const color = getColor(notification.type)

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-2xl p-6 relative"
                    style={{
                      background: notification.read
                        ? premiumDesign.colors.neutral[900]
                        : premiumDesign.glass.medium.background,
                      border: notification.read
                        ? `1px solid ${premiumDesign.colors.neutral[800]}`
                        : premiumDesign.glass.medium.border,
                    }}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Icon */}
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: `${color}20`,
                          border: `1px solid ${color}40`,
                        }}
                      >
                        <Icon size={24} style={{ color }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-white">{notification.title}</h3>
                          <div className="flex items-center space-x-2">
                            {!notification.read && (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => markAsRead(notification.id)}
                                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                                title={t('notifications.mark_as_read')}
                              >
                                <Check size={16} className="text-success-500" />
                              </motion.button>
                            )}
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => deleteNotification(notification.id)}
                              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                              title={t('common.delete')}
                            >
                              <Trash2 size={16} className="text-danger-500" />
                            </motion.button>
                          </div>
                        </div>

                        <p className="text-sm text-neutral-400 mb-3">
                          {notification.message}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-500">
                            {format(new Date(notification.created_at), 'dd. MMM yyyy, HH:mm', { locale: de })}
                          </span>

                          {notification.action && (
                            <motion.a
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              href={notification.action.url}
                              className="text-sm font-semibold px-4 py-1.5 rounded-lg"
                              style={{
                                background: premiumDesign.glass.light.background,
                                color: premiumDesign.colors.primary[400],
                              }}
                            >
                              {notification.action.label}
                            </motion.a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Unread Indicator */}
                    {!notification.read && (
                      <div
                        className="absolute top-6 right-6 w-2 h-2 rounded-full animate-pulse"
                        style={{ background: premiumDesign.colors.primary[500] }}
                      />
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default Notifications