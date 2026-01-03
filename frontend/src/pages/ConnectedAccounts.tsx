import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, RefreshCw, ShieldCheck, ExternalLink, Check, Loader2, AlertCircle } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useUserStore } from '../store/userStore'
import { apiService } from '../lib/api'

interface ConnectedAccount {
  id: string
  type: 'paypal' | 'bank'
  email?: string
  name?: string
  is_default: boolean
  connected_at?: string
  balance?: number
}

const ConnectedAccounts = () => {
  const { t } = useLanguage()
  const { user } = useUserStore()

  const [accounts, setAccounts] = useState<ConnectedAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [connecting, setConnecting] = useState(false)

  // Загрузка подключенных счетов
  const loadAccounts = async () => {
    if (!user?.telegram_id) return

    setLoading(true)
    setError(null)

    try {
      const response = await apiService.accounts.list(user.telegram_id)
      setAccounts(response.data.accounts || [])
    } catch (err: any) {
      console.error('Failed to load accounts:', err)
      setError(t('wallet.error_loading'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAccounts()
  }, [user?.telegram_id])

  // Синхронизация счета
  const handleSync = async (accountId: string, accountType: string) => {
    if (!user?.telegram_id) return

    setSyncing(accountId)
    setError(null)

    try {
      if (accountType === 'paypal') {
        await apiService.paypal.sync(user.telegram_id)
      } else {
        await apiService.accounts.sync(parseInt(accountId), user.telegram_id)
      }

      // Показываем успех
      const tg = (window as any).Telegram?.WebApp
      if (tg) {
        tg.showAlert(t('wallet.sync_success'))
      }

      // Обновляем список
      await loadAccounts()
    } catch (err: any) {
      console.error('Sync error:', err)
      setError(t('wallet.sync_error'))
    } finally {
      setSyncing(null)
    }
  }

  // Подключение PayPal
  const handleConnectPayPal = async () => {
    if (!user?.telegram_id) return

    setConnecting(true)
    setError(null)

    try {
      const response = await apiService.paypal.getAuthUrl(user.telegram_id)

      if (response.data.authorization_url) {
        // Открываем OAuth в новой вкладке
        const tg = (window as any).Telegram?.WebApp
        if (tg) {
          tg.openLink(response.data.authorization_url)
        } else {
          window.open(response.data.authorization_url, '_blank')
        }

        setShowConnectModal(false)
      }
    } catch (err: any) {
      console.error('Connect PayPal error:', err)
      setError(t('wallet.connect_error'))
    } finally {
      setConnecting(false)
    }
  }

  // Карточка счета
  const AccountCard = ({ account }: { account: ConnectedAccount }) => {
    const getAccountColor = (type: string) => {
      switch (type) {
        case 'paypal':
          return 'linear-gradient(135deg, #0070BA 0%, #1546A0 100%)'
        case 'bank':
          return 'linear-gradient(135deg, #FF4B2B 0%, #FF416C 100%)'
        default:
          return 'linear-gradient(135deg, #6B73FF 0%, #000DFF 100%)'
      }
    }

    const getAccountIcon = (type: string) => {
      switch (type) {
        case 'paypal':
          return '💳'
        case 'bank':
          return '🏦'
        default:
          return '💰'
      }
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5 }}
        className="w-full h-48 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between mb-4 shadow-2xl"
        style={{ background: getAccountColor(account.type) }}
      >
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]" />

        {/* Header */}
        <div className="relative z-10 flex justify-between items-start">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getAccountIcon(account.type)}</span>
            <div>
              <span className="text-white font-bold text-sm">{account.name || account.type.toUpperCase()}</span>
              {account.is_default && (
                <div className="flex items-center gap-1 mt-1">
                  <Check size={12} className="text-emerald-300" />
                  <span className="text-emerald-300 text-xs font-medium">{t('wallet.default')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Sync Button */}
          <button
            onClick={() => handleSync(account.id, account.type)}
            disabled={syncing === account.id}
            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-all disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={`text-white ${syncing === account.id ? 'animate-spin' : ''}`}
            />
          </button>
        </div>

        {/* Email/Info */}
        {account.email && (
          <div className="relative z-10">
            <p className="text-white/60 text-xs mb-1">{t('wallet.account_email')}</p>
            <p className="text-white text-sm font-medium">{account.email}</p>
          </div>
        )}

        {/* Connected Date */}
        {account.connected_at && (
          <div className="relative z-10 flex justify-between items-center text-white/70 text-xs">
            <span>{t('wallet.connected')}: {new Date(account.connected_at).toLocaleDateString()}</span>
          </div>
        )}
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24 px-5 pt-8">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            {t('wallet.title')}
          </h1>
          <p className="text-neutral-500 text-sm">{t('wallet.manage_accounts')}</p>
        </div>
        <button
          onClick={loadAccounts}
          disabled={loading}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3"
        >
          <AlertCircle className="text-rose-400" size={20} />
          <p className="text-rose-400 text-sm">{error}</p>
        </motion.div>
      )}

      {/* Cards Stack */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="w-full h-48 rounded-3xl bg-neutral-900/50 animate-pulse" />
          ))}
        </div>
      ) : accounts.length > 0 ? (
        <div className="perspective-1000">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-neutral-900/50 flex items-center justify-center">
            <ShieldCheck size={32} className="text-neutral-600" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">{t('wallet.no_accounts')}</h3>
          <p className="text-neutral-500 text-sm">{t('wallet.connect_first')}</p>
        </div>
      )}

      {/* Add New Button */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowConnectModal(true)}
        className="w-full py-4 mt-4 rounded-2xl border-2 border-dashed border-neutral-800 text-neutral-500 font-bold flex items-center justify-center gap-2 hover:bg-neutral-900/50 hover:text-white hover:border-indigo-500/50 transition-all"
      >
        <Plus size={20} /> {t('wallet.connect_new')}
      </motion.button>

      {/* Security Notice */}
      <div className="mt-8 p-4 bg-neutral-900/50 rounded-2xl border border-white/5">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg shrink-0">
            <ShieldCheck size={20} className="text-emerald-500" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">{t('wallet.security_title')}</h4>
            <p className="text-xs text-neutral-400 mt-1">{t('wallet.security_desc')}</p>
          </div>
        </div>
      </div>

      {/* Connect Modal */}
      <AnimatePresence>
        {showConnectModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-neutral-900 rounded-3xl border border-white/10 overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="p-5 border-b border-white/5">
                <h2 className="text-xl font-bold text-white">{t('wallet.connect_account')}</h2>
                <p className="text-sm text-neutral-500 mt-1">{t('wallet.choose_provider')}</p>
              </div>

              {/* Options */}
              <div className="p-5 space-y-3">
                {/* PayPal */}
                <button
                  onClick={handleConnectPayPal}
                  disabled={connecting}
                  className="w-full p-4 rounded-2xl bg-[#0070BA] hover:bg-[#1546A0] transition-all flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                      💳
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-white">PayPal</p>
                      <p className="text-xs text-white/70">{t('wallet.paypal_desc')}</p>
                    </div>
                  </div>
                  {connecting ? (
                    <Loader2 size={20} className="text-white animate-spin" />
                  ) : (
                    <ExternalLink size={20} className="text-white" />
                  )}
                </button>

                {/* Open Banking (Coming Soon) */}
                <div className="relative p-4 rounded-2xl bg-neutral-800/50 border border-white/5 opacity-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-neutral-700 rounded-full flex items-center justify-center">
                        🏦
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-white">Open Banking</p>
                        <p className="text-xs text-neutral-500">{t('wallet.bank_desc')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 px-2 py-1 bg-indigo-500 rounded text-xs font-bold text-white">
                    {t('wallet.coming_soon')}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-white/5">
                <button
                  onClick={() => setShowConnectModal(false)}
                  className="w-full py-3 rounded-xl bg-neutral-800 text-white font-semibold hover:bg-neutral-700 transition-all"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ConnectedAccounts
