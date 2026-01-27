import React, { useState } from 'react';
import { Palette, X } from 'lucide-react';
import ColorPalette from './ColorPalette';

interface ColorPickerBannerProps {
    groupName: string;
    onColorSelect: (color: string) => void;
    onDismiss: () => void;
}

const ColorPickerBanner: React.FC<ColorPickerBannerProps> = ({
    groupName,
    onColorSelect,
    onDismiss
}) => {
    const [selectedColor, setSelectedColor] = useState('#10b981'); // Default emerald green
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onColorSelect(selectedColor);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed top-0 left-0 right-0 z-50 animate-fade-in-down">
            <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 dark:from-primary/20 dark:to-purple-500/20 backdrop-blur-sm border-b border-primary/20 dark:border-primary/30">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                                    <Palette size={20} className="text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                        Defina a cor do seu novo serviço
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Personalize a cor de <span className="font-semibold">{groupName}</span> para facilitar a identificação
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onDismiss}
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                title="Fechar (manter cor padrão)"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Color Palette */}
                        <div className="mb-4">
                            <ColorPalette
                                selectedColor={selectedColor}
                                onColorChange={setSelectedColor}
                                size="md"
                            />
                        </div>

                        {/* Preview & Action */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-8 h-8 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700"
                                    style={{ backgroundColor: selectedColor }}
                                />
                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                    Cor selecionada
                                </span>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                                {isSaving ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ColorPickerBanner;
