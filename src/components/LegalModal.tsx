import React from 'react';
import { X, Shield, FileText, Lock } from 'lucide-react';

interface LegalModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'terms' | 'privacy';
}

const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, type }) => {
    if (!isOpen) return null;

    const isTerms = type === 'terms';
    const title = isTerms ? 'Termos de Uso' : 'Política de Privacidade';
    const Icon = isTerms ? FileText : Shield;

    return (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-scale-in">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Icon className="text-primary" size={24} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">
                            {title}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 text-slate-600 dark:text-slate-400 leading-relaxed text-sm scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
                    {isTerms ? (
                        <div className="space-y-6">
                            <section>
                                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">1. Aceitação dos Termos</h4>
                                <p>Ao acessar e utilizar o NexaEscala, você concorda em cumprir e estar vinculado a estes Termos de Uso. Este serviço é destinado exclusivamente a profissionais e instituições de saúde.</p>
                            </section>

                            <section>
                                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">2. Descrição do Serviço</h4>
                                <p>O NexaEscala é uma plataforma de gestão de escalas médicas que facilita a organização de plantões, trocas de horário e comunicação entre equipes. O app é uma ferramenta de suporte e não substitui a responsabilidade administrativa formal das instituições.</p>
                            </section>

                            <section>
                                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">3. Responsabilidades do Usuário</h4>
                                <p>O usuário é responsável pela veracidade dos dados informados (incluindo CRM e especialidade) e pela confidencialidade de sua senha. É proibido o uso da plataforma para fins ilícitos ou que comprometam a segurança dos dados de pacientes ou colegas.</p>
                            </section>

                            <section>
                                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">4. Propriedade Intelectual</h4>
                                <p>Todo o conteúdo, design e código do NexaEscala são protegidos por leis de propriedade intelectual. É proibida a reprodução, engenharia reversa ou distribuição sem autorização prévia.</p>
                            </section>

                            <section>
                                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">5. Limitação de Responsabilidade</h4>
                                <p>O NexaEscala não se responsabiliza por erros médicos, falta de profissionais em plantões ou decisões administrativas tomadas com base nas informações do app. Somos uma ferramenta facilitatingora de gestão.</p>
                            </section>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <section>
                                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">1. Coleta de Dados</h4>
                                <p>Coletamos dados essenciais como Nome, E-mail, CRM e Especialidade para permitir sua identificação e atuação nas escalas de serviço. Armazenamos logs de acesso para auditoria e segurança.</p>
                            </section>

                            <section>
                                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">2. Uso das Informações</h4>
                                <p>Seus dados são usados exclusivamente para: gerenciar escalas, enviar notificações de plantão, processar solicitações de troca e gerar relatórios de produção financeira quando solicitado.</p>
                            </section>

                            <section>
                                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">3. Proteção e Segurança</h4>
                                <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-2xl mb-4">
                                    <Lock size={16} />
                                    <p className="font-bold text-xs uppercase tracking-wider">Dados Criptografados</p>
                                </div>
                                <p>Implementamos criptografia de ponta a ponta na transmissão de dados e hashes seguros para armazenamento de senhas. Seus dados nunca são vendidos a terceiros.</p>
                            </section>

                            <section>
                                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">4. Seus Direitos (LGPD)</h4>
                                <p>Em conformidade com a LGPD, você tem direito ao acesso, retificação e exclusão de seus dados. Caso deseje encerrar sua conta, todos os seus dados pessoais identificáveis serão removidos de nossos sistemas ativos.</p>
                            </section>

                            <section>
                                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">5. Cookies</h4>
                                <p>Utilizamos cookies apenas para manter sua sessão ativa e garantir que você não precise fazer login repetidamente. Não utilizamos cookies de rastreamento publicitário.</p>
                            </section>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all"
                    >
                        Entendi
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LegalModal;
