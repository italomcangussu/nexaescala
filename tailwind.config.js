/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: '#059669', // Emerald 600
                primaryLight: '#34d399', // Emerald 400
                primaryDark: '#047857', // Emerald 700
                surface: '#f8fafc', // Slate 50
                surfaceDark: '#0f172a', // Slate 900
                textPrimary: '#1e293b', // Slate 800
                textSecondary: '#64748b', // Slate 500
                error: '#ef4444', // Red 500
            },
            animation: {
                'fade-in-up': 'fadeInUp 0.3s ease-out forwards',
                'fade-in': 'fadeIn 0.3s ease-out forwards',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
            },
            keyframes: {
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                shake: {
                    '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
                    '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
                    '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
                    '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
                }
            },
            boxShadow: {
                'float': '0 10px 30px -10px rgba(0, 0, 0, 0.2)',
            }
        },
    },
    plugins: [],
}
