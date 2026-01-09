import React from 'react';

interface SwitchProps {
    isOn: boolean;
    onToggle: () => void;
}

const Switch: React.FC<SwitchProps> = ({ isOn, onToggle }) => (
    <button
        onClick={onToggle}
        className={`w-11 h-6 rounded-full relative transition-colors duration-200 ease-in-out focus:outline-none ${isOn ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-600'}`}
    >
        <div
            className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 left-0.5 transition-transform duration-200 ${isOn ? 'translate-x-5' : 'translate-x-0'}`}
        />
    </button>
);

export default Switch;
