import { useState, useEffect } from 'react';
import { ThemeOption } from '../types';

export const useTheme = (initialTheme: ThemeOption = 'system') => {
    const [themeMode, setThemeMode] = useState<ThemeOption>(initialTheme);

    useEffect(() => {
        const root = window.document.documentElement;
        const applyTheme = () => {
            let isDark = false;
            if (themeMode === 'dark') isDark = true;
            else if (themeMode === 'light') isDark = false;
            else if (themeMode === 'system') isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            else if (themeMode === 'auto') {
                const hour = new Date().getHours();
                isDark = hour >= 18 || hour < 6;
            }
            if (isDark) root.classList.add('dark');
            else root.classList.remove('dark');
        };
        applyTheme();
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => { if (themeMode === 'system') applyTheme(); };
        const interval = setInterval(() => { if (themeMode === 'auto') applyTheme(); }, 60000);
        mediaQuery.addEventListener('change', handleChange);
        return () => { mediaQuery.removeEventListener('change', handleChange); clearInterval(interval); };
    }, [themeMode]);

    return { themeMode, setThemeMode };
};
