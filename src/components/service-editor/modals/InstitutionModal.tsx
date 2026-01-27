import React from 'react';
import { X, Search, ChevronLeft, Plus, Building } from 'lucide-react';

interface InstitutionModalProps {
    isOpen: boolean;
    showNewForm: boolean;
    searchQuery: string;
    searchResults: string[];
    formData: {
        name: string;
        city: string;
        state: string;
        phone: string;
    };
    onClose: () => void;
    onSearch: (query: string) => void;
    onSelect: (name: string) => void;
    onShowNewForm: () => void;
    onHideNewForm: () => void;
    onUpdateForm: (field: string, value: string) => void;
    onSave: () => void;
}

const InstitutionModal: React.FC<InstitutionModalProps> = ({
    isOpen,
    showNewForm,
    searchQuery,
    searchResults,
    formData,
    onClose,
    onSearch,
    onSelect,
    onShowNewForm,
    onHideNewForm,
    onUpdateForm,
    onSave,
}) => {
    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 bg-white dark:bg-slate-900 z-50 flex flex-col animate-fade-in-up">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                    {showNewForm ? 'Nova Instituição' : 'Selecionar Instituição'}
                </h3>
                <button
                    type="button"
                    onClick={onClose}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                    <X className="text-slate-400" size={20} />
                </button>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 overflow-y-auto">
                {!showNewForm ? (
                    <div className="space-y-6">
                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute left-3 top-3.5 text-slate-400" size={20} />
                            <input
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/50 text-slate-800 dark:text-white"
                                placeholder="Buscar instituição..."
                                value={searchQuery}
                                onChange={e => onSearch(e.target.value)}
                                autoFocus
                            />
                        </div>

                        {/* Results */}
                        <div>
                            {searchResults.length > 0 && (
                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">
                                    Resultados Encontrados
                                </h4>
                            )}
                            <div className="space-y-2">
                                {searchResults.map(inst => (
                                    <button
                                        type="button"
                                        key={inst}
                                        onClick={() => onSelect(inst)}
                                        className="w-full text-left p-4 rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 hover:border-primary hover:bg-primary/5 transition-all text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-3 group"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                            <Building size={20} className="text-slate-400 group-hover:text-primary" />
                                        </div>
                                        {inst}
                                    </button>
                                ))}

                                {searchQuery.length > 2 && searchResults.length === 0 && (
                                    <p className="text-center text-slate-400 text-sm py-4">
                                        Nenhuma instituição encontrada com esse nome.
                                    </p>
                                )}

                                {searchQuery.length <= 2 && (
                                    <div className="text-center py-8">
                                        <Building size={48} className="mx-auto text-slate-200 dark:text-slate-700 mb-3" />
                                        <p className="text-slate-400 text-sm">
                                            Digite o nome para buscar instituições cadastradas.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Create New Button */}
                        <button
                            type="button"
                            onClick={onShowNewForm}
                            className="w-full py-4 border-2 border-dashed border-primary/30 text-primary font-bold rounded-xl hover:bg-primary/5 hover:border-primary/50 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={18} />
                            Cadastrar Nova Instituição
                        </button>
                    </div>
                ) : (
                    <div className="animate-fade-in-right space-y-4">
                        {/* Back Button */}
                        <button
                            type="button"
                            onClick={onHideNewForm}
                            className="text-xs font-bold text-slate-500 hover:text-primary flex items-center gap-1 mb-4"
                        >
                            <ChevronLeft size={14} />
                            Voltar para busca
                        </button>

                        {/* Form */}
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome da Instituição</label>
                                <input
                                    placeholder="Ex: Hospital São Lucas"
                                    value={formData.name}
                                    onChange={e => onUpdateForm('name', e.target.value)}
                                    className="w-full p-3 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cidade</label>
                                    <input
                                        placeholder="São Paulo"
                                        value={formData.city}
                                        onChange={e => onUpdateForm('city', e.target.value)}
                                        className="w-full p-3 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div className="w-24">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estado</label>
                                    <input
                                        placeholder="SP"
                                        value={formData.state}
                                        onChange={e => onUpdateForm('state', e.target.value)}
                                        maxLength={2}
                                        className="w-full p-3 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 uppercase"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefone (opcional)</label>
                                <input
                                    placeholder="(11) 99999-9999"
                                    value={formData.phone}
                                    onChange={e => onUpdateForm('phone', e.target.value)}
                                    className="w-full p-3 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={onSave}
                                disabled={!formData.name}
                                className="w-full py-3.5 bg-primary text-white font-bold rounded-xl text-sm hover:bg-primaryDark transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                            >
                                Salvar e Selecionar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InstitutionModal;
