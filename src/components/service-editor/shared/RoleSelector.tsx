import React from 'react';
import { ServiceRole } from '../../../types';

interface RoleSelectorProps {
    selectedRoles: ServiceRole[];
    onChange: (roles: ServiceRole[]) => void;
    disabled?: boolean;
    size?: 'sm' | 'md';
}

const ROLE_LABELS: Record<ServiceRole, string> = {
    [ServiceRole.ADMIN]: 'ADM',
    [ServiceRole.ADMIN_AUX]: 'ADM AUX',
    [ServiceRole.PLANTONISTA]: 'PLANT',
    [ServiceRole.VISITANTE]: 'VIS',
};

const ROLE_DESCRIPTIONS: Record<ServiceRole, string> = {
    [ServiceRole.ADMIN]: 'Administrador',
    [ServiceRole.ADMIN_AUX]: 'Administrador Auxiliar',
    [ServiceRole.PLANTONISTA]: 'Plantonista',
    [ServiceRole.VISITANTE]: 'Visitante',
};

const RoleSelector: React.FC<RoleSelectorProps> = ({
    selectedRoles,
    onChange,
    disabled = false,
    size = 'md',
}) => {
    const handleToggle = (role: ServiceRole) => {
        if (disabled) return;

        const isSelected = selectedRoles.includes(role);

        if (isSelected) {
            // Don't allow removing the last role
            if (selectedRoles.length > 1) {
                onChange(selectedRoles.filter(r => r !== role));
            }
        } else {
            onChange([...selectedRoles, role]);
        }
    };

    const sizeClasses = size === 'sm'
        ? 'px-2 py-1 text-[10px]'
        : 'px-3 py-1.5 text-xs';

    return (
        <div className="flex flex-wrap gap-1.5">
            {Object.values(ServiceRole).map(role => {
                const isSelected = selectedRoles.includes(role);

                return (
                    <button
                        key={role}
                        type="button"
                        onClick={() => handleToggle(role)}
                        disabled={disabled}
                        title={ROLE_DESCRIPTIONS[role]}
                        className={`${sizeClasses} font-bold rounded-lg transition-all ${isSelected
                                ? 'bg-primary text-white shadow-sm shadow-primary/20'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'}`}
                    >
                        {ROLE_LABELS[role]}
                    </button>
                );
            })}
        </div>
    );
};

export default RoleSelector;
