import { useState, useEffect } from 'react';

interface AccessibilityPreferences {
    prefersReducedMotion: boolean;
    prefersHighContrast: boolean;
    prefersDarkMode: boolean;
    fontSize: 'normal' | 'large' | 'extra-large';
}

/**
 * Hook to detect and respond to system accessibility preferences
 * Supports: Reduced Motion, High Contrast, Dark Mode, Font Size
 */
export const useAccessibility = (): AccessibilityPreferences => {
    const [preferences, setPreferences] = useState<AccessibilityPreferences>({
        prefersReducedMotion: false,
        prefersHighContrast: false,
        prefersDarkMode: false,
        fontSize: 'normal'
    });

    useEffect(() => {
        // Check for reduced motion preference
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const updateMotion = () => {
            setPreferences(prev => ({ ...prev, prefersReducedMotion: motionQuery.matches }));
        };
        updateMotion();
        motionQuery.addEventListener('change', updateMotion);

        // Check for high contrast preference
        const contrastQuery = window.matchMedia('(prefers-contrast: high)');
        const updateContrast = () => {
            setPreferences(prev => ({ ...prev, prefersHighContrast: contrastQuery.matches }));
        };
        updateContrast();
        contrastQuery.addEventListener('change', updateContrast);

        // Check for dark mode preference
        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const updateDarkMode = () => {
            setPreferences(prev => ({ ...prev, prefersDarkMode: darkModeQuery.matches }));
        };
        updateDarkMode();
        darkModeQuery.addEventListener('change', updateDarkMode);

        // Cleanup listeners
        return () => {
            motionQuery.removeEventListener('change', updateMotion);
            contrastQuery.removeEventListener('change', updateContrast);
            darkModeQuery.removeEventListener('change', updateDarkMode);
        };
    }, []);

    return preferences;
};

/**
 * Announces a message to screen readers (VoiceOver, TalkBack)
 * @param message - The message to announce
 * @param priority - 'polite' (default) or 'assertive'
 */
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
};

/**
 * Manages focus for better keyboard/screen reader navigation
 */
export const useFocusManagement = () => {
    const trapFocus = (containerRef: React.RefObject<HTMLElement>) => {
        if (!containerRef.current) return;

        const focusableElements = containerRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        const handleTabKey = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    lastElement?.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastElement) {
                    firstElement?.focus();
                    e.preventDefault();
                }
            }
        };

        containerRef.current.addEventListener('keydown', handleTabKey);

        return () => {
            containerRef.current?.removeEventListener('keydown', handleTabKey);
        };
    };

    const focusFirst = (containerRef: React.RefObject<HTMLElement>) => {
        if (!containerRef.current) return;

        const focusableElements = containerRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        const firstElement = focusableElements[0] as HTMLElement;
        firstElement?.focus();
    };

    return { trapFocus, focusFirst };
};
