import React from 'react';
import { Check } from 'lucide-react';

interface ColorPaletteProps {
    selectedColor: string;
    onColorChange: (color: string) => void;
    size?: 'sm' | 'md' | 'lg';
}

const AVAILABLE_COLORS = [
    { value: '#ef4444', name: 'Vermelho' },
    { value: '#f97316', name: 'Laranja' },
    { value: '#eab308', name: 'Amarelo' },
    { value: '#10b981', name: 'Verde Esmeralda' },
    { value: '#06b6d4', name: 'Ciano' },
    { value: '#3b82f6', name: 'Azul' },
    { value: '#8b5cf6', name: 'Roxo' },
    { value: '#ec4899', name: 'Rosa' },
];

const ColorPalette: React.FC<ColorPaletteProps> = ({
    selectedColor,
    onColorChange,
    size = 'md'
}) => {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16'
    };

    const checkSizes = {
        sm: 14,
        md: 18,
        lg: 24
    };

    return (
        <div className="grid grid-cols-4 gap-3">
            {AVAILABLE_COLORS.map((color) => {
                const isSelected = selectedColor === color.value;

                return (
                    <button
                        key={color.value}
                        type="button"
                        onClick={() => onColorChange(color.value)}
                        className={`${sizeClasses[size]} rounded-full transition-all relative group`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                    >
                        {/* Selection indicator */}
                        {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Check
                                    size={checkSizes[size]}
                                    className="text-white drop-shadow-lg"
                                    strokeWidth={3}
                                />
                            </div>
                        )}

                        {/* Hover ring */}
                        <div
                            className={`absolute inset-0 rounded-full transition-all ${isSelected
                                    ? 'ring-4 ring-offset-2 dark:ring-offset-slate-900'
                                    : 'ring-0 group-hover:ring-2 group-hover:ring-offset-2 dark:group-hover:ring-offset-slate-900'
                                }`}
                            style={{
                                ringColor: color.value,
                                '--tw-ring-color': color.value
                            } as React.CSSProperties}
                        />
                    </button>
                );
            })}
        </div>
    );
};

export default ColorPalette;
