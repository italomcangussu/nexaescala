import React from 'react';
import { ArrowLeft, MessageCircle, Mail, ExternalLink } from 'lucide-react';

interface SettingsHelpProps {
    onBack: () => void;
}

const SettingsHelp: React.FC<SettingsHelpProps> = ({ onBack }) => {
    const FAQs = [
        { q: 'Como solicito uma troca?', a: 'Toque em um de seus plantões na escala e selecione "Solicitar Troca".' },
        { q: 'Como vejo meus ganhos?', a: 'Acesse a aba "Financeiro" no menu inferior para ver o resumo de todos os seus serviços.' },
        { q: 'Esqueci minha senha', a: 'Na tela de login, utilize o link "Esqueci minha senha" para receber instruções por e-mail.' },
    ];

    return (
        <div className="px-6 animate-fade-in-up w-full">
            <div className="flex items-center mb-6 relative px-1">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 ml-2">Central de Ajuda</h2>
            </div>

            <div className="space-y-6">
                {/* FAQ Section */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-2">Perguntas Frequentes</h3>
                    <div className="space-y-3">
                        {FAQs.map((faq, i) => (
                            <div key={i} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">{faq.q}</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Contact Support */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-2">Fale Conosco</h3>
                    <button className="w-full flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400 group">
                        <div className="flex items-center gap-3">
                            <MessageCircle size={20} />
                            <span className="text-sm font-bold">Suporte via WhatsApp</span>
                        </div>
                        <ExternalLink size={16} />
                    </button>

                    <button className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-3">
                            <Mail size={20} />
                            <span className="text-sm font-bold">Enviar E-mail</span>
                        </div>
                        <ExternalLink size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsHelp;
