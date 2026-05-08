/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#05080f',
          900: '#0a0e1a',
          800: '#0f1629',
          700: '#151d38',
          600: '#1e2a4a',
          500: '#2a3a65',
        },
        gold: {
          300: '#fde68a',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          glow: '#fbbf24',
        },
        rarity: {
          common: '#9ca3af',
          uncommon: '#22c55e',
          rare: '#3b82f6',
          epic: '#a855f7',
          legendary: '#f59e0b',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        logo: ['var(--font-logo)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gold-shimmer': 'linear-gradient(105deg, transparent 40%, rgba(251,191,36,0.3) 50%, transparent 60%)',
      },
      boxShadow: {
        'gold-glow': '0 0 20px rgba(251, 191, 36, 0.4), 0 0 40px rgba(251, 191, 36, 0.2)',
        'gold-glow-sm': '0 0 10px rgba(251, 191, 36, 0.3)',
        'rare-glow': '0 0 20px rgba(59, 130, 246, 0.4)',
        'epic-glow': '0 0 20px rgba(168, 85, 247, 0.4)',
        'legendary-glow': '0 0 30px rgba(251, 191, 36, 0.6), 0 0 60px rgba(251, 191, 36, 0.3)',
        'card': '0 20px 60px rgba(0,0,0,0.6)',
      },
      animation: {
        'shimmer': 'shimmer 2s infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'card-flip': 'card-flip 0.6s ease-in-out',
        'card-reveal': 'card-reveal 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'spin-slow': 'spin 4s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
        'particle': 'particle 1s ease-out forwards',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(251,191,36,0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(251,191,36,0.7), 0 0 80px rgba(251,191,36,0.4)' },
        },
        'card-flip': {
          '0%': { transform: 'rotateY(0deg)' },
          '50%': { transform: 'rotateY(90deg)' },
          '100%': { transform: 'rotateY(0deg)' },
        },
        'card-reveal': {
          '0%': { transform: 'scale(0) rotate(-10deg)', opacity: '0' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        particle: {
          '0%': { transform: 'translate(0,0) scale(1)', opacity: '1' },
          '100%': { transform: 'translate(var(--tx),var(--ty)) scale(0)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
