import React from 'react';

const PrivacyPolicy: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 shadow rounded-lg p-8">
                <h1 className="text-3xl font-bold mb-6">Política de Privacidade</h1>
                <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

                <p className="mb-6">
                    A sua privacidade é importante para nós. É política do NexaEscala respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar no aplicativo NexaEscala, e outros sites que possuímos e operamos.
                </p>

                <h2 className="text-xl font-semibold mb-3">1. Informações que Coletamos</h2>
                <p className="mb-4">
                    Solicitamos informações pessoais apenas quando realmente precisamos delas para lhe fornecer um serviço. Fazemo-lo por meios justos e legais, com o seu conhecimento e consentimento. Também informamos por que estamos coletando e como será usado.
                </p>
                <ul className="list-disc pl-5 mb-4 space-y-2">
                    <li><strong>Dados de Identificação:</strong> Nome, endereço de e-mail e número de telefone (opcional) para criar e gerenciar sua conta.</li>
                    <li><strong>Dados de Uso:</strong> Informações sobre como você usa o aplicativo, incluindo interações com escalas e trocas de plantão.</li>
                    <li><strong>Dados do Dispositivo:</strong> Modelo do dispositivo, sistema operacional e identificadores únicos para fins de suporte e melhoria do serviço.</li>
                </ul>

                <h2 className="text-xl font-semibold mb-3">2. Uso das Informações</h2>
                <p className="mb-4">
                    Usamos as informações coletadas para:
                </p>
                <ul className="list-disc pl-5 mb-4 space-y-2">
                    <li>Fornecer, operar e manter nosso aplicativo;</li>
                    <li>Melhorar, personalizar e expandir nosso aplicativo;</li>
                    <li>Entender e analisar como você usa nosso aplicativo;</li>
                    <li>Desenvolver novos produtos, serviços, características e funcionalidades;</li>
                    <li>Comunicar com você, diretamente ou através de um dos nossos parceiros, inclusive para atendimento ao cliente, para fornecer atualizações e outras informações relacionadas ao aplicativo.</li>
                </ul>

                <h2 className="text-xl font-semibold mb-3">3. Compartilhamento de Informações</h2>
                <p className="mb-4">
                    Não compartilhamos informações de identificação pessoal publicamente ou com terceiros, exceto quando exigido por lei.
                </p>

                <h2 className="text-xl font-semibold mb-3">4. Retenção de Dados</h2>
                <p className="mb-4">
                    Apenas retemos as informações coletadas pelo tempo necessário para fornecer o serviço solicitado. Quando armazenamos dados, protegemos dentro de meios comercialmente aceitáveis ​​para evitar perdas e roubos, bem como acesso, divulgação, cópia, uso ou modificação não autorizados.
                </p>

                <h2 className="text-xl font-semibold mb-3">5. Seus Direitos</h2>
                <p className="mb-4">
                    Você é livre para recusar a nossa solicitação de informações pessoais, entendendo que talvez não possamos fornecer alguns dos serviços desejados. Se você deseja excluir seus dados ou conta, entre em contato conosco através do suporte do aplicativo.
                </p>

                <h2 className="text-xl font-semibold mb-3">6. Crianças</h2>
                <p className="mb-4">
                    O NexaEscala não se destina a menores de 13 anos. Não coletamos intencionalmente informações pessoais identificáveis de crianças menores de 13 anos. Se você é pai/mãe ou responsável e sabe que seu filho nos forneceu dados pessoais, entre em contato conosco.
                </p>

                <h2 className="text-xl font-semibold mb-3">7. Alterações nesta Política</h2>
                <p className="mb-4">
                    Podemos atualizar nossa Política de Privacidade periodicamente. Aconselhamos que você revise esta página periodicamente para quaisquer alterações. Notificaremos você sobre quaisquer alterações publicando a nova Política de Privacidade nesta página.
                </p>

                <h2 className="text-xl font-semibold mb-3">8. Contato</h2>
                <p className="mb-4">
                    Se você tiver alguma dúvida sobre esta Política de Privacidade, entre em contato conosco.
                </p>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
