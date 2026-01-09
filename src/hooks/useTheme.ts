import { useState, useEffect } from 'react';
import { ThemeOption } from '../types';

export const useTheme = (_initialTheme: ThemeOption = 'light') => {
    const [themeMode, setThemeMode] = useState<ThemeOption>('light');

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('dark');
    }, []);

    return { themeMode, setThemeMode };
};
