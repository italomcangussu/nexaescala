import React from 'react';
import { ShiftPreset } from '../types';
import { Moon, Sun, Clock } from 'lucide-react';

interface ShiftLegendProps {
    presets: ShiftPreset[];
}

const ShiftLegend: React.FC<ShiftLegendProps> = ({ presets }) => {
    if (presets.length === 0) return null;

    // Sort presets by start time
    const sortedPresets = [...presets].sort((a, b) =>
        a.start_time.localeCompare(b.start_time)
    );

    const getShiftIcon = (preset: ShiftPreset) => {
        const hour = parseInt(preset.start_time.split(':')[0]);
        const isNight = hour >= 18 || hour < 6;
        return isNight ? Moon : Sun;
    };

    const getShiftColor = (preset: ShiftPreset) => {
        const hour = parseInt(preset.start_time.split(':')[0]);
        const isNight = hour >= 18 || hour < 6;
        return isNight
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-200 dark:border-blue-800'
            : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 border-orange-200 dark:border-orange-800';
    };

    const formatTime = (time: string) => {
        return time.slice(0, 5); // "07:00:00" -> "07:00"
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-2 mb-3">
                <Clock size={16} className="text-slate-400" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Turnos do Serviço
                </h3>
            </div>

            <div className="flex flex-wrap gap-3">
                {sortedPresets.map((preset) => {
                    const Icon = getShiftIcon(preset);
                    const colorClass = getShiftColor(preset);

                    return (
                        <div
                            key={preset.id}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${colorClass} transition-colors`}
                        >
                            <Icon size={14} strokeWidth={2.5} />
                            <div className="flex flex-col">
                                <span className="text-xs font-black leading-none">
                                    {preset.code}
                                </span>
                                <span className="text-[10px] font-medium opacity-80 leading-none mt-0.5">
                                    {formatTime(preset.start_time)} - {formatTime(preset.end_time)}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ShiftLegend;
