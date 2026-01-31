import { useState, useEffect } from 'react';

interface DeviceDetection {
    isDesktop: boolean;
    isMobile: boolean;
    isWebSubdomain: boolean;
    shouldShowDesktopVersion: boolean;
    screenWidth: number;
}

/**
 * Hook para detectar o tipo de dispositivo e subdomain
 * Usado para renderizar a versão correta do app (mobile vs desktop)
 */
export const useDeviceDetection = (): DeviceDetection => {
    const [screenWidth, setScreenWidth] = useState(
        typeof window !== 'undefined' ? window.innerWidth : 1024
    );

    useEffect(() => {
        const handleResize = () => {
            setScreenWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Desktop = largura >= 1024px
    const isDesktop = screenWidth >= 1024;
    const isMobile = screenWidth < 768;

    // Verifica se está acessando via web.nexaescala.com
    const isWebSubdomain = typeof window !== 'undefined'
        ? window.location.hostname.startsWith('web.') ||
        window.location.hostname === 'web.nexaescala.com' ||
        // Para desenvolvimento local
        window.location.search.includes('desktop=true')
        : false;

    // Mostrar versão desktop se:
    // 1. Está no subdomain web.* E tela é grande o suficiente
    // 2. OU está em tela grande (>=1024px) e no subdomain
    const shouldShowDesktopVersion = isWebSubdomain && isDesktop;

    return {
        isDesktop,
        isMobile,
        isWebSubdomain,
        shouldShowDesktopVersion,
        screenWidth
    };
};

export default useDeviceDetection;
