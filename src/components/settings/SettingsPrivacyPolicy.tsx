import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface SettingsPrivacyPolicyProps {
    onBack: () => void;
    onDeleteAccount: () => void;
}

const SettingsPrivacyPolicy: React.FC<SettingsPrivacyPolicyProps> = ({ onBack, onDeleteAccount }) => {
    return (
        <div className="px-6 animate-fade-in-up w-full h-full flex flex-col">
            <div className="flex items-center mb-6 relative px-1">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 ml-2">Políticas de Privacidade</h2>
            </div>

            <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 overflow-y-auto text-sm text-slate-600 dark:text-slate-300 leading-relaxed shadow-inner">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2">1. Introdução</h3>
                <p className="mb-4">O NexaEscala valoriza a privacidade de seus usuários. Esta Política de Privacidade descreve como coletamos, usamos e protegemos suas informações pessoais.</p>

                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2">2. Coleta de Dados</h3>
                <p className="mb-4">Coletamos informações fornecidas diretamente por você, como nome, CRM, e-mail e dados de escalas, necessários para o funcionamento do serviço de gestão hospitalar.</p>

                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2">3. Uso das Informações</h3>
                <p className="mb-4">Seus dados são utilizados exclusivamente para gerenciamento de escalas, notificações de plantão e comunicação entre membros da equipe médica.</p>

                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2">4. Compartilhamento</h3>
                <p className="mb-4">Não vendemos suas informações. Compartilhamos dados apenas com a instituição hospitalar à qual você está vinculado dentro do aplicativo.</p>

                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2">5. Segurança</h3>
                <p className="mb-4">Implementamos medidas de segurança robustas para proteger seus dados contra acesso não autorizado.</p>

                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2">6. Exclusão de Dados</h3>
                <p className="mb-2">Você tem o direito de solicitar a remoção completa dos seus dados de nossos servidores. Para iniciar este processo agora, clique no link abaixo:</p>
                <button
                    onClick={onDeleteAccount}
                    className="text-primary font-bold hover:underline mb-8 inline-flex items-center"
                >
                    Acessar área de Exclusão de Conta
                </button>
            </div>
        </div>
    );
};

export default SettingsPrivacyPolicy;
