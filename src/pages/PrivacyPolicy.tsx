import React from 'react';
import { ArrowLeft, Shield, Lock, Eye, Mail, FileText, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
    const navigate = useNavigate();
    const lastUpdate = '31 de Janeiro de 2026';

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 via-emerald-50/30 to-slate-50 dark:from-slate-950 dark:via-emerald-950/10 dark:to-slate-950 py-12 px-4 sm:px-6 lg:px-8">
            {/* Header with Back Button */}
            <div className="max-w-4xl mx-auto mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mb-6"
                >
                    <ArrowLeft size={16} />
                    Voltar
                </button>
            </div>

            {/* Main Container */}
            <div className="max-w-4xl mx-auto bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden border border-slate-200/50 dark:border-slate-700/50">

                {/* Header Section */}
                <div className="bg-linear-to-r from-emerald-600 to-teal-600 px-8 py-12 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCA0LTRzNCwyIDQsNHYyYzAgMi0yIDQtNCA0cy00LTItNC00di0yem0wLTMwYzAtMiAyLTQgNC00czQgMiA0IDR2MmMwIDItMiA0LTQgNC00IDItNC0yLTR2LTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                <Shield size={28} />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black tracking-tight">Política de Privacidade</h1>
                                <p className="text-emerald-100 font-medium mt-1">NexaEscala - Gestão de Escalas Médicas</p>
                            </div>
                        </div>
                        <p className="text-sm text-emerald-100 font-medium mt-6 flex items-center gap-2">
                            <FileText size={16} />
                            Última atualização: {lastUpdate}
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="px-8 py-10 space-y-8">

                    {/* Introduction */}
                    <section>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            A sua privacidade é extremamente importante para nós. Esta Política de Privacidade descreve como o <strong>NexaEscala</strong> ("nós", "nosso" ou "aplicativo") coleta, usa, armazena e protege suas informações pessoais quando você utiliza nosso aplicativo móvel e serviços relacionados.
                        </p>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-4">
                            Ao utilizar o NexaEscala, você concorda com a coleta e uso de informações de acordo com esta política. Esta política está em conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD)</strong> brasileira e o <strong>Regulamento Geral de Proteção de Dados (GDPR)</strong> europeu.
                        </p>
                    </section>

                    {/* Section 1 */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                                <Eye size={20} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">1. Informações que Coletamos</h2>
                        </div>

                        <p className="text-slate-700 dark:text-slate-300 mb-4">
                            Coletamos diferentes tipos de informações para fornecer e melhorar nosso serviço:
                        </p>

                        <div className="space-y-4 pl-4">
                            <div className="border-l-4 border-emerald-500 pl-4 py-2">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-2">1.1. Informações Fornecidas por Você</h3>
                                <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
                                    <li><strong>Dados de Cadastro:</strong> Nome completo, endereço de e-mail, número de telefone (opcional), CRM (quando aplicável).</li>
                                    <li><strong>Informações Profissionais:</strong> Especialidade médica, instituição de trabalho, formação acadêmica.</li>
                                    <li><strong>Foto de Perfil:</strong> Imagem de perfil enviada voluntariamente por você.</li>
                                    <li><strong>Dados de Uso:</strong> Informações sobre escalas criadas, plantões atribuídos, trocas de plantão solicitadas.</li>
                                </ul>
                            </div>

                            <div className="border-l-4 border-blue-500 pl-4 py-2">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-2">1.2. Informações Coletadas Automaticamente</h3>
                                <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
                                    <li><strong>Dados do Dispositivo:</strong> Modelo do dispositivo, sistema operacional (iOS/Android), versão do aplicativo, identificadores únicos do dispositivo.</li>
                                    <li><strong>Dados de Conexão:</strong> Endereço IP, tipo de navegador, fuso horário.</li>
                                    <li><strong>Logs de Acesso:</strong> Data e hora de acesso, ações realizadas no aplicativo.</li>
                                    <li><strong>Cookies e Armazenamento Local:</strong> Utilizamos cookies de sessão e armazenamento local para manter você conectado e melhorar sua experiência.</li>
                                </ul>
                            </div>

                            <div className="border-l-4 border-purple-500 pl-4 py-2">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-2">1.3. Informações de Terceiros</h3>
                                <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
                                    <li><strong>Login Social:</strong> Se você optar por fazer login utilizando Google ou Apple Sign-In, coletamos seu nome, e-mail e foto de perfil fornecidos por esses serviços.</li>
                                    <li><strong>Provedores de Serviço:</strong> Utilizamos o Supabase para armazenamento e autenticação de dados.</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Section 2 */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                <FileText size={20} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">2. Como Usamos Suas Informações</h2>
                        </div>

                        <p className="text-slate-700 dark:text-slate-300 mb-4">
                            Utilizamos as informações coletadas para as seguintes finalidades:
                        </p>

                        <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
                            <li><strong>Prestação de Serviços:</strong> Criar e gerenciar sua conta, permitir acesso às funcionalidades de escalas e plantões.</li>
                            <li><strong>Comunicação:</strong> Enviar notificações sobre mudanças em escalas, trocas de plantão, atualizações do aplicativo.</li>
                            <li><strong>Personalização:</strong> Adaptar a experiência do usuário com base em suas preferências e histórico de uso.</li>
                            <li><strong>Segurança:</strong> Proteger contra fraudes, abusos e atividades não autorizadas.</li>
                            <li><strong>Melhoria do Serviço:</strong> Analisar padrões de uso para melhorar funcionalidades e desenvolver novos recursos.</li>
                            <li><strong>Suporte Técnico:</strong> Responder a dúvidas, solicitações e problemas técnicos.</li>
                            <li><strong>Conformidade Legal:</strong> Cumprir obrigações legais e regulatórias aplicáveis.</li>
                        </ul>
                    </section>

                    {/* Section 3 */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                                <AlertCircle size={20} className="text-amber-600 dark:text-amber-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">3. Compartilhamento de Informações</h2>
                        </div>

                        <p className="text-slate-700 dark:text-slate-300 mb-4">
                            Nós <strong>não vendemos</strong> suas informações pessoais. Podemos compartilhar seus dados nas seguintes situações:
                        </p>

                        <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
                            <li><strong>Provedores de Serviço:</strong> Compartilhamos dados com o Supabase (infraestrutura de backend e banco de dados) e outros prestadores de serviços que nos ajudam a operar o aplicativo, sob rigorosos termos de confidencialidade.</li>
                            <li><strong>Requisitos Legais:</strong> Podemos divulgar informações se exigido por lei, ordem judicial ou solicitação governamental.</li>
                            <li><strong>Proteção de Direitos:</strong> Para proteger os direitos, propriedade ou segurança do NexaEscala, nossos usuários ou terceiros.</li>
                            <li><strong>Transferência de Negócio:</strong> Em caso de fusão, aquisição ou venda de ativos, suas informações poderão ser transferidas, mas continuarão protegidas por esta política.</li>
                        </ul>

                        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                            <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                                <strong>Importante:</strong> Todos os nossos prestadores de serviço são obrigados a manter a confidencialidade de suas informações e só podem usá-las para os fins específicos que autorizamos.
                            </p>
                        </div>
                    </section>

                    {/* Section 4 */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                                <Lock size={20} className="text-red-600 dark:text-red-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">4. Segurança de Dados</h2>
                        </div>

                        <p className="text-slate-700 dark:text-slate-300 mb-4">
                            A segurança de seus dados é nossa prioridade máxima. Implementamos medidas técnicas e organizacionais para proteger suas informações:
                        </p>

                        <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
                            <li><strong>Criptografia:</strong> Todos os dados são transmitidos através de conexões HTTPS/TLS criptografadas.</li>
                            <li><strong>Armazenamento Seguro:</strong> Utilizamos o Supabase, que oferece criptografia de dados em repouso e em trânsito.</li>
                            <li><strong>Autenticação:</strong> Senhas são armazenadas com hash criptográfico (bcrypt) e nunca em texto plano.</li>
                            <li><strong>Controle de Acesso:</strong> Acesso restrito aos dados apenas por pessoal autorizado e em base de necessidade.</li>
                            <li><strong>Monitoramento:</strong> Sistemas de detecção de intrusão e logs de auditoria para identificar atividades suspeitas.</li>
                        </ul>

                        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                            <p className="text-sm text-red-800 dark:text-red-200">
                                <strong>Atenção:</strong> Apesar de nossos esforços, nenhum método de transmissão pela internet é 100% seguro. Recomendamos que você utilize senhas fortes e únicas, e ative a autenticação de dois fatores quando disponível.
                            </p>
                        </div>
                    </section>

                    {/* Section 5 */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                                <Shield size={20} className="text-purple-600 dark:text-purple-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">5. Seus Direitos (LGPD/GDPR)</h2>
                        </div>

                        <p className="text-slate-700 dark:text-slate-300 mb-4">
                            Em conformidade com a LGPD e o GDPR, você tem os seguintes direitos:
                        </p>

                        <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
                            <li><strong>Acesso:</strong> Solicitar uma cópia de todos os dados pessoais que temos sobre você.</li>
                            <li><strong>Correção:</strong> Solicitar a correção de dados incorretos ou desatualizados.</li>
                            <li><strong>Exclusão:</strong> Solicitar a exclusão de seus dados pessoais ("direito ao esquecimento").</li>
                            <li><strong>Portabilidade:</strong> Solicitar a transferência de seus dados para outro provedor de serviços.</li>
                            <li><strong>Oposição:</strong> Opor-se ao processamento de seus dados para determinadas finalidades.</li>
                            <li><strong>Restrição:</strong> Solicitar a limitação do processamento de seus dados.</li>
                            <li><strong>Revogação de Consentimento:</strong> Retirar seu consentimento a qualquer momento, sem afetar a legalidade do processamento anterior.</li>
                        </ul>

                        <p className="text-slate-700 dark:text-slate-300 mt-4">
                            Para exercer seus direitos, entre em contato conosco através do canal de suporte do aplicativo ou pelo e-mail: <a href="mailto:privacidade@nexaescala.com" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">privacidade@nexaescala.com</a>
                        </p>
                    </section>

                    {/* Section 6 */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">6. Retenção de Dados</h2>
                        <p className="text-slate-700 dark:text-slate-300">
                            Retemos suas informações pessoais apenas pelo tempo necessário para cumprir as finalidades descritas nesta política, a menos que um período de retenção mais longo seja exigido ou permitido por lei. Quando você solicita a exclusão de sua conta, seus dados pessoais são permanentemente removidos de nossos sistemas ativos em até <strong>30 dias</strong>, exceto quando a retenção for necessária para cumprimento de obrigações legais.
                        </p>
                    </section>

                    {/* Section 7 */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">7. Menores de Idade</h2>
                        <p className="text-slate-700 dark:text-slate-300">
                            O NexaEscala não é destinado a menores de <strong>18 anos</strong>. Não coletamos intencionalmente informações pessoais de menores. Se você é pai, mãe ou responsável e acredita que seu filho nos forneceu dados pessoais, entre em contato conosco imediatamente para que possamos excluir essas informações.
                        </p>
                    </section>

                    {/* Section 8 */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">8. Cookies e Tecnologias Similares</h2>
                        <p className="text-slate-700 dark:text-slate-300 mb-4">
                            Utilizamos cookies e tecnologias de armazenamento local para:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
                            <li>Manter você conectado ao aplicativo (cookies de sessão).</li>
                            <li>Lembrar suas preferências e configurações.</li>
                            <li>Analisar o uso do aplicativo e melhorar a experiência.</li>
                        </ul>
                        <p className="text-slate-700 dark:text-slate-300 mt-4">
                            Você pode gerenciar as preferências de cookies através das configurações do seu navegador ou dispositivo. Observe que desabilitar cookies pode afetar algumas funcionalidades do aplicativo.
                        </p>
                    </section>

                    {/* Section 9 */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">9. Transferência Internacional de Dados</h2>
                        <p className="text-slate-700 dark:text-slate-300">
                            Seus dados podem ser transferidos e armazenados em servidores localizados fora do Brasil, incluindo Estados Unidos e Europa, onde nossos provedores de serviço (Supabase) mantêm sua infraestrutura. Garantimos que todas as transferências sejam realizadas com salvaguardas adequadas, como cláusulas contratuais padrão aprovadas pela LGPD e GDPR.
                        </p>
                    </section>

                    {/* Section 10 */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">10. Alterações nesta Política</h2>
                        <p className="text-slate-700 dark:text-slate-300">
                            Podemos atualizar esta Política de Privacidade periodicamente para refletir mudanças em nossas práticas ou por outros motivos operacionais, legais ou regulatórios. Quando fizermos alterações significativas, notificaremos você por e-mail e/ou através de um aviso destacado no aplicativo. A data da última atualização estará sempre visível no topo desta página.
                        </p>
                        <p className="text-slate-700 dark:text-slate-300 mt-4">
                            Aconselhamos que você revise esta política periodicamente para se manter informado sobre como estamos protegendo suas informações.
                        </p>
                    </section>

                    {/* Section 11 */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                                <Mail size={20} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">11. Contato e Encarregado de Dados (DPO)</h2>
                        </div>

                        <p className="text-slate-700 dark:text-slate-300 mb-4">
                            Se você tiver dúvidas, preocupações ou solicitações relacionadas a esta Política de Privacidade ou ao tratamento de seus dados pessoais, entre em contato conosco:
                        </p>

                        <div className="bg-surface dark:bg-slate-800/50 rounded-xl p-6 space-y-3">
                            <div className="flex items-start gap-3">
                                <Mail size={20} className="text-emerald-600 dark:text-emerald-400 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">E-mail de Privacidade:</p>
                                    <a href="mailto:privacidade@nexaescala.com" className="text-emerald-600 dark:text-emerald-400 hover:underline">privacidade@nexaescala.com</a>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <FileText size={20} className="text-emerald-600 dark:text-emerald-400 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">Suporte Técnico:</p>
                                    <a href="mailto:suporte@nexaescala.com" className="text-emerald-600 dark:text-emerald-400 hover:underline">suporte@nexaescala.com</a>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Shield size={20} className="text-emerald-600 dark:text-emerald-400 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">Encarregado de Proteção de Dados (DPO):</p>
                                    <a href="mailto:dpo@nexaescala.com" className="text-emerald-600 dark:text-emerald-400 hover:underline">dpo@nexaescala.com</a>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Footer Note */}
                    <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                            Esta Política de Privacidade está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) e o Regulamento Geral de Proteção de Dados (GDPR - EU 2016/679).
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-4">
                            <strong>NexaEscala</strong> © 2026 - Todos os direitos reservados.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
