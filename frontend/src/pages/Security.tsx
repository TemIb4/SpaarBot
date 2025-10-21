import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Lock, Eye, EyeOff, Smartphone, Key, Check } from 'lucide-react'
import { premiumDesign } from '../config/premiumDesign'

const Security: React.FC = () => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [biometricEnabled, setBiometricEnabled] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  })

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.new !== passwordData.confirm) {
      alert('Passwörter stimmen nicht überein')
      return
    }

    setLoading(true)
    try {
      // TODO: API call to change password
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert('Passwort erfolgreich geändert')
      setPasswordData({ current: '', new: '', confirm: '' })
    } catch (error) {
      console.error('Error changing password:', error)
      alert('Fehler beim Ändern des Passworts')
    } finally {
      setLoading(false)
    }
  }

  const toggle2FA = async () => {
    setLoading(true)
    try {
      // TODO: API call to toggle 2FA
      await new Promise(resolve => setTimeout(resolve, 1500))
      setTwoFactorEnabled(!twoFactorEnabled)
      alert(twoFactorEnabled
        ? '2FA deaktiviert'
        : '2FA aktiviert. Überprüfe deine E-Mail für den Bestätigungscode.')
    } catch (error) {
      console.error('Error toggling 2FA:', error)
      alert('Fehler beim Umschalten von 2FA')
    } finally {
      setLoading(false)
    }
  }

  const toggleBiometric = async () => {
    setLoading(true)
    try {
      // TODO: API call to toggle biometric auth
      await new Promise(resolve => setTimeout(resolve, 1500))
      setBiometricEnabled(!biometricEnabled)
    } catch (error) {
      console.error('Error toggling biometric:', error)
      alert('Fehler beim Umschalten der biometrischen Authentifizierung')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-10rem)] py-8">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Sicherheit</h1>
          <p className="text-neutral-400">Schütze dein Konto mit zusätzlichen Sicherheitsmaßnahmen</p>
        </div>

        {/* Password Change */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl p-6 mb-6"
          style={{
            background: premiumDesign.colors.neutral[900],
            border: `1px solid ${premiumDesign.colors.neutral[800]}`,
          }}
        >
          <div className="flex items-center space-x-3 mb-6">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: `${premiumDesign.colors.primary[500]}20`,
                border: `1px solid ${premiumDesign.colors.primary[500]}40`,
              }}
            >
              <Lock size={24} className="text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Passwort ändern</h2>
              <p className="text-sm text-neutral-400">Aktualisiere dein Passwort regelmäßig</p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">
                Aktuelles Passwort
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordData.current}
                  onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-white pr-12"
                  style={{
                    background: premiumDesign.glass.light.background,
                    border: premiumDesign.glass.light.border,
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">
                Neues Passwort
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordData.new}
                onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                className="w-full px-4 py-3 rounded-xl text-white"
                style={{
                  background: premiumDesign.glass.light.background,
                  border: premiumDesign.glass.light.border,
                }}
                required
                minLength={8}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">
                Passwort bestätigen
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordData.confirm}
                onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                className="w-full px-4 py-3 rounded-xl text-white"
                style={{
                  background: premiumDesign.glass.light.background,
                  border: premiumDesign.glass.light.border,
                }}
                required
                minLength={8}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white"
              style={{
                background: premiumDesign.colors.gradients.primary,
                boxShadow: premiumDesign.effects.shadow.glow,
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2" />
                  Wird gespeichert...
                </span>
              ) : (
                'Passwort ändern'
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Two-Factor Authentication */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl p-6 mb-6"
          style={{
            background: premiumDesign.colors.neutral[900],
            border: `1px solid ${premiumDesign.colors.neutral[800]}`,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: `${premiumDesign.colors.success[500]}20`,
                  border: `1px solid ${premiumDesign.colors.success[500]}40`,
                }}
              >
                <Smartphone size={24} className="text-success-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Zwei-Faktor-Authentifizierung</h2>
                <p className="text-sm text-neutral-400">
                  Zusätzliche Sicherheitsebene für dein Konto
                </p>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggle2FA}
              disabled={loading}
              className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors"
              style={{
                background: twoFactorEnabled
                  ? premiumDesign.colors.success[500]
                  : premiumDesign.colors.neutral[700],
              }}
            >
              <span
                className="inline-block h-6 w-6 transform rounded-full bg-white transition-transform"
                style={{
                  transform: twoFactorEnabled ? 'translateX(2rem)' : 'translateX(0.25rem)',
                }}
              />
            </motion.button>
          </div>

          {twoFactorEnabled && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-4 pt-4"
              style={{
                borderTop: `1px solid ${premiumDesign.colors.neutral[800]}`,
              }}
            >
              <div
                className="p-4 rounded-xl flex items-start space-x-3"
                style={{
                  background: `${premiumDesign.colors.success[500]}10`,
                  border: `1px solid ${premiumDesign.colors.success[500]}30`,
                }}
              >
                <Check size={20} className="text-success-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-neutral-300">
                  <p className="font-semibold text-white mb-1">2FA ist aktiviert</p>
                  <p>
                    Bei jeder Anmeldung erhältst du einen Bestätigungscode per E-Mail.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Biometric Authentication */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="rounded-3xl p-6"
          style={{
            background: premiumDesign.colors.neutral[900],
            border: `1px solid ${premiumDesign.colors.neutral[800]}`,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: `${premiumDesign.colors.accent[500]}20`,
                  border: `1px solid ${premiumDesign.colors.accent[500]}40`,
                }}
              >
                <Key size={24} className="text-accent-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Biometrische Authentifizierung</h2>
                <p className="text-sm text-neutral-400">
                  Face ID oder Touch ID nutzen
                </p>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleBiometric}
              disabled={loading}
              className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors"
              style={{
                background: biometricEnabled
                  ? premiumDesign.colors.accent[500]
                  : premiumDesign.colors.neutral[700],
              }}
            >
              <span
                className="inline-block h-6 w-6 transform rounded-full bg-white transition-transform"
                style={{
                  transform: biometricEnabled ? 'translateX(2rem)' : 'translateX(0.25rem)',
                }}
              />
            </motion.button>
          </div>

          {biometricEnabled && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-4 pt-4"
              style={{
                borderTop: `1px solid ${premiumDesign.colors.neutral[800]}`,
              }}
            >
              <div
                className="p-4 rounded-xl flex items-start space-x-3"
                style={{
                  background: `${premiumDesign.colors.accent[500]}10`,
                  border: `1px solid ${premiumDesign.colors.accent[500]}30`,
                }}
              >
                <Check size={20} className="text-accent-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-neutral-300">
                  <p className="font-semibold text-white mb-1">Biometrische Authentifizierung aktiv</p>
                  <p>
                    Du kannst dich jetzt mit Face ID oder Touch ID anmelden.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Security Tips */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 rounded-2xl p-6"
          style={{
            background: premiumDesign.glass.medium.background,
            border: premiumDesign.glass.medium.border,
          }}
        >
          <div className="flex items-start space-x-3">
            <Shield size={20} className="text-primary-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-neutral-300">
              <p className="font-semibold text-white mb-2">Sicherheitstipps</p>
              <ul className="space-y-1">
                <li>• Verwende ein starkes, einzigartiges Passwort</li>
                <li>• Aktiviere die Zwei-Faktor-Authentifizierung</li>
                <li>• Teile dein Passwort niemals mit anderen</li>
                <li>• Überprüfe regelmäßig deine Kontoaktivitäten</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Security