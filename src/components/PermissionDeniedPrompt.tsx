import React from 'react';
import { Settings, XCircle } from 'lucide-react';
import { openAppSettings } from '../plugins/nativeSettings';

type PermissionType = 'camera' | 'photos';

interface PermissionDeniedPromptProps {
  isOpen: boolean;
  onClose: () => void;
  permissionType: PermissionType;
}

const PermissionDeniedPrompt: React.FC<PermissionDeniedPromptProps> = ({
  isOpen,
  onClose,
  permissionType,
}) => {
  if (!isOpen) return null;

  const title = permissionType === 'camera' ? 'Acesso a Camera' : 'Acesso a Fotos';
  const description =
    permissionType === 'camera'
      ? 'O acesso a camera foi bloqueado. Para tirar uma foto, ative a permissao nas configuracoes do iPhone.'
      : 'O acesso a fotos foi bloqueado. Para escolher uma imagem, ative a permissao nas configuracoes do iPhone.';

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-scale-in">
        <div className="p-8 text-center">
          <div className="mx-auto w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-6">
            <XCircle className="text-red-600" size={40} />
          </div>

          <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-3 leading-tight">
            {title} negado
          </h3>

          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed px-2">
            {description}
          </p>

          <div className="space-y-3">
            <button
              onClick={async () => {
                await openAppSettings();
                onClose();
              }}
              className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 dark:shadow-none hover:bg-primary-dark transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2"
            >
              <Settings size={18} />
              Abrir Ajustes
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>

        <div className="bg-surface dark:bg-slate-800/50 py-3 px-6 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center font-medium uppercase tracking-widest">
            Voce pode alterar isso a qualquer momento
          </p>
        </div>
      </div>
    </div>
  );
};

export default PermissionDeniedPrompt;

