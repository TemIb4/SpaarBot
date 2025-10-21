// src/pages/Profile.tsx

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Calendar, MapPin, Edit2, Save, X } from 'lucide-react'
import { premiumDesign } from '../config/premiumDesign'
import { useUserStore } from '../store/userStore'

const Profile: React.FC = () => {
  const { user, isPremium, updateUser } = useUserStore()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    email: '',
    location: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        email: user.email || '',
        location: user.location || '',
      })
    }
  }, [user])

  const handleSave = async () => {
    if (!updateUser) return;
    setLoading(true)
    try {
      await updateUser({
        first_name: formData.first_name,
        email: formData.email,
        location: formData.location
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Fehler beim Speichern')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        email: user.email || '',
        location: user.location || '',
      })
    }
    setIsEditing(false)
  }

  return (
    <div className="min-h-[calc(100vh-10rem)] py-8">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-2xl mx-auto"
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Mein Profil</h1>
          {!isEditing && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 rounded-xl font-semibold text-white flex items-center space-x-2"
              style={{
                background: premiumDesign.glass.medium.background,
                border: premiumDesign.glass.medium.border,
              }}
            >
              <Edit2 size={18} />
              <span>Bearbeiten</span>
            </motion.button>
          )}
        </div>

        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="rounded-3xl p-8 mb-6"
          style={{
            background: premiumDesign.colors.neutral[900],
            border: `1px solid ${premiumDesign.colors.neutral[800]}`,
          }}
        >
          <div className="flex items-center space-x-6 mb-8">
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center text-4xl font-bold relative"
              style={{
                background: premiumDesign.colors.gradients.primary,
                boxShadow: premiumDesign.effects.shadow.glow,
              }}
            >
              {user?.first_name?.[0] || 'U'}
              {isPremium && (
                <div
                  className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm"
                  style={{
                    background: premiumDesign.colors.gradients.premium,
                  }}
                >
                  👑
                </div>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                {user?.first_name || 'User'}
              </h2>
              <p className="text-neutral-400">@{user?.username || 'username'}</p>
              {isPremium && (
                <div
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold mt-2"
                  style={{
                    background: premiumDesign.colors.gradients.premium,
                    color: '#fff',
                  }}
                >
                  ✨ Premium Member
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">
                Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-white"
                  style={{
                    background: premiumDesign.glass.light.background,
                    border: premiumDesign.glass.light.border,
                  }}
                />
              ) : (
                <div
                  className="px-4 py-3 rounded-xl flex items-center space-x-3"
                  style={{
                    background: premiumDesign.glass.light.background,
                    border: premiumDesign.glass.light.border,
                  }}
                >
                  <User size={20} className="text-neutral-400" />
                  <span className="text-white">{user?.first_name || 'Nicht angegeben'}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">
                E-Mail
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-white"
                  style={{
                    background: premiumDesign.glass.light.background,
                    border: premiumDesign.glass.light.border,
                  }}
                />
              ) : (
                <div
                  className="px-4 py-3 rounded-xl flex items-center space-x-3"
                  style={{
                    background: premiumDesign.glass.light.background,
                    border: premiumDesign.glass.light.border,
                  }}
                >
                  <Mail size={20} className="text-neutral-400" />
                  <span className="text-white">{user?.email || 'Nicht angegeben'}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">
                Standort
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-white"
                  placeholder="z.B. Berlin, Deutschland"
                  style={{
                    background: premiumDesign.glass.light.background,
                    border: premiumDesign.glass.light.border,
                  }}
                />
              ) : (
                <div
                  className="px-4 py-3 rounded-xl flex items-center space-x-3"
                  style={{
                    background: premiumDesign.glass.light.background,
                    border: premiumDesign.glass.light.border,
                  }}
                >
                  <MapPin size={20} className="text-neutral-400" />
                  <span className="text-white">{user?.location || 'Nicht angegeben'}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">
                Mitglied seit
              </label>
              <div
                className="px-4 py-3 rounded-xl flex items-center space-x-3"
                style={{
                  background: premiumDesign.glass.light.background,
                  border: premiumDesign.glass.light.border,
                }}
              >
                <Calendar size={20} className="text-neutral-400" />
                <span className="text-white">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })
                    : 'Unbekannt'}
                </span>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="flex space-x-4 mt-8">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={loading}
                className="flex-1 py-3 rounded-xl font-semibold text-white flex items-center justify-center space-x-2"
                style={{
                  background: premiumDesign.colors.gradients.primary,
                  boxShadow: premiumDesign.effects.shadow.glow,
                }}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
                ) : (
                  <>
                    <Save size={18} />
                    <span>Speichern</span>
                  </>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 py-3 rounded-xl font-semibold text-neutral-300 flex items-center justify-center space-x-2"
                style={{
                  background: premiumDesign.glass.medium.background,
                  border: premiumDesign.glass.medium.border,
                }}
              >
                <X size={18} />
                <span>Abbrechen</span>
              </motion.button>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-4"
        >
          {[
            { label: 'Transaktionen', value: user?.total_transactions || 0 },
            { label: 'Kategorien', value: user?.categories_count || 0 },
            { label: 'Abonnements', value: user?.subscriptions_count || 0 },
          ].map((stat, index) => (
            <div
              key={index}
              className="rounded-2xl p-4 text-center"
              style={{
                background: premiumDesign.glass.medium.background,
                border: premiumDesign.glass.medium.border,
              }}
            >
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-xs text-neutral-400">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Profile