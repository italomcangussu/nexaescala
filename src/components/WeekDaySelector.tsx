import React from 'react';

interface WeekDaySelectorProps {
    selectedDays: number[];
    onChange: (days: number[]) => void;
}

const WeekDaySelector: React.FC<WeekDaySelectorProps> = ({ selectedDays, onChange }) => {
    const days = [
        { label: 'D', value: 0 },
        { label: 'S', value: 1 },
        { label: 'T', value: 2 },
        { label: 'Q', value: 3 },
        { label: 'Q', value: 4 },
        { label: 'S', value: 5 },
        { label: 'S', value: 6 },
    ];

    const toggleDay = (day: number) => {
        if (selectedDays.includes(day)) {
            onChange(selectedDays.filter(d => d !== day));
        } else {
            onChange([...selectedDays, day].sort());
        }
    };

    return (
        <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase block mb-2 text-center">
                Dias da Semana
            </label>
            <div className="flex justify-between gap-1">
                {days.map((day, index) => {
                    const isSelected = selectedDays.includes(day.value);
                    return (
                        <button
                            key={`${day.value}-${index}`}
                            type="button"
                            onClick={() => toggleDay(day.value)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${isSelected
                                ? 'bg-primary text-white shadow-lg shadow-emerald-200 dark:shadow-none scale-105'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                        >
                            {day.label}
                        </button>
                    );
                })}
            </div>
            <p className="text-[10px] text-slate-400 mt-2 text-center">
                Toque para selecionar os dias do plantão
            </p>
        </div>
    );
};

export default WeekDaySelector;
