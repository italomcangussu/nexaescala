import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import Logo from './Logo';
import Portal from './Portal';

interface DraggableFABProps {
    onClick: () => void;
}

const DraggableFAB: React.FC<DraggableFABProps> = ({ onClick }) => {
    // Initial position: Bottom right (approximately where it was before)
    const [position, setPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 150 });
    const [isDragging, setIsDragging] = useState(false);
    const [hasDragged, setHasDragged] = useState(false);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Padding from screen edges
    const EDGE_PADDING = 16;
    const BUTTON_SIZE = 64;

    const snapToEdge = useCallback((currentX: number, currentY: number) => {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        // Determine nearest horizontal edge
        const targetX = currentX < screenWidth / 2 ? EDGE_PADDING : screenWidth - BUTTON_SIZE - EDGE_PADDING;

        // Clamp Y within safe vertical bounds
        const minY = EDGE_PADDING;
        const maxY = screenHeight - BUTTON_SIZE - 100; // Account for bottom nav
        const targetY = Math.max(minY, Math.min(maxY, currentY));

        setPosition({ x: targetX, y: targetY });
    }, [BUTTON_SIZE, EDGE_PADDING]);

    const handleStart = (clientX: number, clientY: number) => {
        setIsDragging(true);
        setHasDragged(false);
        dragStartPos.current = {
            x: clientX - position.x,
            y: clientY - position.y
        };
    };

    const handleMove = useCallback((clientX: number, clientY: number) => {
        if (!isDragging) return;

        if (!hasDragged) setHasDragged(true);

        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        // Calculate potential position
        let newX = clientX - dragStartPos.current.x;
        let newY = clientY - dragStartPos.current.y;

        // Clamp to screen boundaries during active drag
        newX = Math.max(0, Math.min(screenWidth - BUTTON_SIZE, newX));
        newY = Math.max(0, Math.min(screenHeight - BUTTON_SIZE, newY));

        setPosition({ x: newX, y: newY });
    }, [isDragging, hasDragged, BUTTON_SIZE]);

    const handleEnd = useCallback(() => {
        if (!isDragging) return;
        setIsDragging(false);

        // Snap to nearest vertical edge
        const screenWidth = window.innerWidth;
        const targetX = position.x < screenWidth / 2 ? EDGE_PADDING : screenWidth - BUTTON_SIZE - EDGE_PADDING;

        // Final clamp for vertical position (respecting safe areas)
        const minY = EDGE_PADDING;
        const maxY = window.innerHeight - BUTTON_SIZE - 100; // Safe area for bottom nav
        const targetY = Math.max(minY, Math.min(maxY, position.y));

        setPosition({ x: targetX, y: targetY });
    }, [isDragging, position, EDGE_PADDING, BUTTON_SIZE]);

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
        const onTouchMove = (e: TouchEvent) => {
            e.preventDefault(); // Prevent page scrolling while dragging
            handleMove(e.touches[0].clientX, e.touches[0].clientY);
        };
        const onEnd = () => handleEnd();

        if (isDragging) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('touchmove', onTouchMove, { passive: false });
            window.addEventListener('mouseup', onEnd);
            window.addEventListener('touchend', onEnd);
        }

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('mouseup', onEnd);
            window.removeEventListener('touchend', onEnd);
        };
    }, [isDragging, handleMove, handleEnd]);

    // Handle screen resize
    useEffect(() => {
        const handleResize = () => {
            snapToEdge(position.x, position.y);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [position, snapToEdge]);

    const handleClick = () => {
        if (!hasDragged) {
            onClick();
        }
    };

    return (
        <Portal>
            <button
                ref={buttonRef}
                onClick={handleClick}
                onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
                onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    touchAction: 'none',
                    transition: isDragging ? 'none' : 'all 0.5s cubic-bezier(0.19, 1, 0.22, 1)'
                }}
                className={`fixed z-[9999] w-16 h-16 rounded-full flex items-center justify-center 
                    ${isDragging ? 'scale-110 opacity-90 cursor-grabbing' : 'scale-100 cursor-grab'}
                    bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl border border-white/40 dark:border-slate-800/20 
                    shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] active:scale-95 transition-transform overflow-visible select-none`}
            >
                {/* Subtle Inner Glow */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />

                <Logo className="w-10 h-10 group-hover:scale-110 transition-transform duration-500 drop-shadow-sm" />

                {/* Floating Plus Badge */}
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white/80 dark:border-slate-900/80 shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
                    <Plus size={14} className="text-white" strokeWidth={4} />
                </div>

                {/* Pulsing Liquid Ring */}
                <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 animate-ping-slow pointer-events-none" />
            </button>
        </Portal>
    );
};

export default DraggableFAB;
