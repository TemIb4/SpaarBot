import { motion } from 'framer-motion'
import { Plus, RefreshCw, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useUserStore } from '../store/userStore'
import { apiService } from '../lib/api'

const ConnectedAccounts = () => {
  const { user } = useUserStore()
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnectPayPal = async () => {
    if (!user?.telegram_id) {
      setError('User not authenticated')
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      // Get PayPal authorization URL
      const response = await apiService.paypal.getAuthUrl(user.telegram_id)
      const authUrl = response.data.auth_url

      if (authUrl) {
        // Open PayPal authorization in new window
        window.open(authUrl, '_blank', 'width=600,height=700')
      } else {
        setError('Failed to get PayPal authorization URL')
      }
    } catch (err: any) {
      console.error('PayPal connection error:', err)
      setError('Failed to connect to PayPal. Please try again.')
    } finally {
      setIsConnecting(false)
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Card = ({ type, balance, number, color }: any) => (
    <motion.div
      whileHover={{ y: -5 }}
      className={`w-full h-48 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between mb-4 shadow-2xl`}
      style={{ background: color }}
    >
      {/* Pattern overlay */}
      <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <div className="relative z-10 flex justify-between items-start">
        <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-white/80" />
            <span className="text-white/80 font-medium text-sm">{type}</span>
        </div>
        <div className="text-white font-bold italic text-lg">VISA</div>
      </div>

      <div className="relative z-10">
        <p className="text-white/60 text-sm mb-1">Total Balance</p>
        <h3 className="text-3xl font-bold text-white">€ {balance}</h3>
      </div>

      <div className="relative z-10 flex justify-between items-center text-white/70 font-mono text-sm">
        <span>•••• •••• •••• {number}</span>
        <span>12/26</span>
      </div>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-black text-white pb-24 px-5 pt-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Wallet</h1>
        <motion.button
          whileTap={{ rotate: 180 }}
          className="p-2 bg-neutral-900 rounded-full border border-neutral-800"
        >
          <RefreshCw size={20} className="text-neutral-400" />
        </motion.button>
      </div>

      {/* Cards Stack */}
      <div className="perspective-1000">
        <Card
          type="PayPal Main"
          balance="2,450.50"
          number="4582"
          color="linear-gradient(135deg, #0070BA 0%, #1546A0 100%)"
        />
        <Card
          type="Sparkasse Debit"
          balance="840.00"
          number="9921"
          color="linear-gradient(135deg, #FF4B2B 0%, #FF416C 100%)"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Add New Button */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handleConnectPayPal}
        disabled={isConnecting}
        className="w-full py-4 mt-4 rounded-2xl border-2 border-dashed border-neutral-800 text-neutral-500 font-bold flex items-center justify-center gap-2 hover:bg-neutral-900/50 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus size={20} /> {isConnecting ? 'Connecting...' : 'Connect New Account'}
      </motion.button>

      <div className="mt-8 p-4 bg-neutral-900/50 rounded-2xl border border-white/5">
        <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
                <ShieldCheck size={20} className="text-emerald-500" />
            </div>
            <div>
                <h4 className="font-bold text-sm text-white">Bank-grade Security</h4>
                <p className="text-xs text-neutral-400 mt-1">Your data is encrypted end-to-end. We never store your banking credentials.</p>
            </div>
        </div>
      </div>
    </div>
  )
}

export default ConnectedAccounts