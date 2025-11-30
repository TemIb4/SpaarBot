import { motion } from 'framer-motion'
import { User, Settings, Shield, Award, ChevronRight, Edit2 } from 'lucide-react'
import { useUserStore } from '../store/userStore'
import { useNavigate } from 'react-router-dom'

const Profile = () => {
  const { user } = useUserStore()
  const navigate = useNavigate()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MenuRow = ({ icon: Icon, label, onClick, badge }: any) => (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 bg-neutral-900/30 border border-white/5 rounded-2xl mb-2 hover:bg-neutral-800 transition-colors"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
            <Icon size={20} className="text-neutral-300" />
        </div>
        <span className="text-white font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {badge && <span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-md">{badge}</span>}
        <ChevronRight size={18} className="text-neutral-600" />
      </div>
    </motion.button>
  )

  return (
    <div className="min-h-screen bg-black text-white pb-24 px-5 pt-8">

      {/* Avatar Section */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative mb-4">
            <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-[2px]">
                <div className="w-full h-full rounded-full bg-neutral-900 flex items-center justify-center overflow-hidden">
                    {/* Placeholder Avatar */}
                    <span className="text-4xl">😎</span>
                </div>
            </div>
            <button className="absolute bottom-0 right-0 p-2 bg-white text-black rounded-full shadow-lg">
                <Edit2 size={14} />
            </button>
        </div>
        <h2 className="text-2xl font-bold text-white">{user?.first_name || 'User Name'}</h2>
        <p className="text-neutral-500">@{user?.username || 'username'}</p>

        {/* Premium Badge */}
        <div className="mt-3 px-3 py-1 bg-gradient-to-r from-amber-200 to-yellow-400 text-black text-xs font-bold rounded-full flex items-center gap-1">
            <Award size={12} /> PREMIUM MEMBER
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
            { label: 'Saved', val: '€1.2k' },
            { label: 'Streak', val: '12 Days' },
            { label: 'Level', val: '5' },
        ].map((s, i) => (
            <div key={i} className="bg-neutral-900/50 border border-white/5 rounded-2xl p-3 text-center">
                <p className="text-white font-bold text-lg">{s.val}</p>
                <p className="text-xs text-neutral-500 uppercase">{s.label}</p>
            </div>
        ))}
      </div>

      {/* Menu Options */}
      <div>
        <h3 className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-4 ml-2">Settings</h3>
        <MenuRow icon={User} label="Personal Info" onClick={() => {}} />
        <MenuRow icon={Shield} label="Security" onClick={() => navigate('/security')} />
        <MenuRow icon={Settings} label="App Settings" onClick={() => navigate('/settings')} />
      </div>

      <div className="mt-8 text-center">
        <button className="text-red-500 text-sm font-medium hover:text-red-400">Log Out</button>
        <p className="text-neutral-700 text-xs mt-4">v1.0.2 • Build 2024</p>
      </div>
    </div>
  )
}

export default Profile