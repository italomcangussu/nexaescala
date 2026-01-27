import React from 'react';

interface SwitchProps {
    isOn: boolean;
    onToggle: () => void;
    id?: string;
    disabled?: boolean;
}

const Switch: React.FC<SwitchProps> = ({ isOn, onToggle, id, disabled = false }) => {
    // Logic:
    // Container: w-12 (48px) h-7 (28px) with p-1 (4px padding)
    // Available Content Width: 48 - 4 - 4 = 40px
    // Thumb: w-5 (20px) h-5 (20px)
    // Travel Distance: Content Width (40px) - Thumb Width (20px) = 20px
    // 20px = translate-x-5 (1.25rem)

    return (
        <button
            type="button"
            id={id}
            onClick={disabled ? undefined : onToggle}
            disabled={disabled}
            className={`
                group relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full p-1 
                transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 border-transparent
                ${isOn ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}
                ${disabled ? 'cursor-not-allowed opacity-50' : ''}
            `}
        >
            <span className="sr-only">Toggle setting</span>
            <span
                aria-hidden="true"
                className={`
                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 
                    transition duration-200 ease-in-out
                    ${isOn ? 'translate-x-[10px]' : 'translate-x-0'}
                `}
            />
        </button>
    );
};

export default Switch;
