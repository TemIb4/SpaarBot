/**
 * Premium Design System - SpaarBot
 * Профессиональная дизайн-система уровня enterprise
 */

export const premiumDesign = {
  // 🎨 PREMIUM COLOR PALETTE
  colors: {
    // Primary (Gradient Blue-Purple)
    primary: {
      50: '#f0f4ff',
      100: '#e0e9ff',
      200: '#c7d7fe',
      300: '#a5bbfd',
      400: '#8098fa',
      500: '#6366f1',  // Main
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
    },

    // Accent (Vibrant Purple-Pink)
    accent: {
      50: '#fdf4ff',
      100: '#fae8ff',
      200: '#f5d0fe',
      300: '#f0abfc',
      400: '#e879f9',
      500: '#d946ef',  // Main
      600: '#c026d3',
      700: '#a21caf',
      800: '#86198f',
      900: '#701a75',
    },

    // Success (Emerald Green)
    success: {
      50: '#ecfdf5',
      100: '#d1fae5',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
    },

    // Warning (Amber)
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
    },

    // Danger (Red)
    danger: {
      50: '#fef2f2',
      100: '#fee2e2',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
    },

    // Neutral (Dark theme optimized)
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
      950: '#0a0a0a',
    },

    // Glass effect backgrounds
    glass: {
      light: 'rgba(255, 255, 255, 0.08)',
      medium: 'rgba(255, 255, 255, 0.12)',
      dark: 'rgba(0, 0, 0, 0.2)',
    },

    // Gradients
    gradients: {
      primary: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
      success: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
      danger: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
      income: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
      expense: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
      premium: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
      accent: 'linear-gradient(135deg, #d946ef 0%, #e879f9 100%)',
    }
  },

  // 📝 PREMIUM TYPOGRAPHY
  typography: {
    fontFamily: {
      sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
      display: "'Cal Sans', 'Inter', sans-serif",
      mono: "'JetBrains Mono', 'Fira Code', monospace",
    },

    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }],
    },

    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    }
  },

  // 🎭 SHADOWS & EFFECTS
  effects: {
    shadow: {
      xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
      glow: '0 0 20px rgba(99, 102, 241, 0.3)',
      glowAccent: '0 0 20px rgba(217, 70, 239, 0.3)',
    },

    blur: {
      xs: '2px',
      sm: '4px',
      md: '8px',
      lg: '12px',
      xl: '16px',
      '2xl': '24px',
      '3xl': '40px',
    },

    animation: {
      duration: {
        fast: '150ms',
        normal: '300ms',
        slow: '500ms',
      },
      easing: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        elastic: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
      }
    }
  },

  // 📐 SPACING & SIZING
  spacing: {
    compact: {
      xs: '0.25rem',  // 4px
      sm: '0.5rem',   // 8px
      md: '0.75rem',  // 12px
      lg: '1rem',     // 16px
      xl: '1.5rem',   // 24px
    },
    comfortable: {
      xs: '0.5rem',   // 8px
      sm: '1rem',     // 16px
      md: '1.5rem',   // 24px
      lg: '2rem',     // 32px
      xl: '3rem',     // 48px
    }
  },

  // 🎪 BORDER RADIUS
  borderRadius: {
    none: '0',
    sm: '0.375rem',   // 6px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.5rem',  // 24px
    '3xl': '2rem',    // 32px
    full: '9999px',
  },

  // 🎨 GLASSMORPHISM
  glass: {
    light: {
      background: 'rgba(255, 255, 255, 0.08)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(12px)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.18)',
    },
    medium: {
      background: 'rgba(255, 255, 255, 0.12)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      backdropFilter: 'blur(16px)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
    },
    dark: {
      background: 'rgba(0, 0, 0, 0.3)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
    }
  }
}

// 🎯 COMPONENT PRESETS
export const componentPresets = {
  card: {
    glass: {
      background: premiumDesign.glass.medium.background,
      border: premiumDesign.glass.medium.border,
      backdropFilter: premiumDesign.glass.medium.backdropFilter,
      borderRadius: premiumDesign.borderRadius.xl,
      padding: premiumDesign.spacing.comfortable.md,
      boxShadow: premiumDesign.effects.shadow.lg,
    },
    solid: {
      background: premiumDesign.colors.neutral[900],
      border: `1px solid ${premiumDesign.colors.neutral[800]}`,
      borderRadius: premiumDesign.borderRadius.xl,
      padding: premiumDesign.spacing.comfortable.md,
      boxShadow: premiumDesign.effects.shadow.md,
    }
  },

  button: {
    primary: {
      background: premiumDesign.colors.gradients.primary,
      color: '#ffffff',
      fontWeight: premiumDesign.typography.fontWeight.semibold,
      padding: `${premiumDesign.spacing.comfortable.sm} ${premiumDesign.spacing.comfortable.lg}`,
      borderRadius: premiumDesign.borderRadius.lg,
      boxShadow: premiumDesign.effects.shadow.glow,
      transition: `all ${premiumDesign.effects.animation.duration.normal} ${premiumDesign.effects.animation.easing.smooth}`,
    },
    ghost: {
      background: 'transparent',
      border: `1px solid ${premiumDesign.colors.neutral[700]}`,
      color: premiumDesign.colors.neutral[300],
      fontWeight: premiumDesign.typography.fontWeight.medium,
      padding: `${premiumDesign.spacing.comfortable.sm} ${premiumDesign.spacing.comfortable.md}`,
      borderRadius: premiumDesign.borderRadius.md,
      transition: `all ${premiumDesign.effects.animation.duration.fast} ${premiumDesign.effects.animation.easing.smooth}`,
    }
  }
}