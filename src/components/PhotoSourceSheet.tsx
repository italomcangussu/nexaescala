import React from 'react';
import { Camera, Images, X } from 'lucide-react';

interface PhotoSourceSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onPickCamera: () => void;
  onPickPhotos: () => void;
}

const PhotoSourceSheet: React.FC<PhotoSourceSheetProps> = ({
  isOpen,
  onClose,
  onPickCamera,
  onPickPhotos,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-surface-dark rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up pb-safe">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
            Escolher Fonte
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-surface dark:hover:bg-slate-800 rounded-full transition-colors"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <button
            onClick={() => {
              onClose();
              onPickCamera();
            }}
            className="w-full flex items-center gap-3 p-4 rounded-2xl bg-surface dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-primary/40 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Camera className="text-primary" size={20} />
            </div>
            <div className="text-left">
              <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Tirar foto</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Abrir a camera</p>
            </div>
          </button>

          <button
            onClick={() => {
              onClose();
              onPickPhotos();
            }}
            className="w-full flex items-center gap-3 p-4 rounded-2xl bg-surface dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-primary/40 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Images className="text-primary" size={20} />
            </div>
            <div className="text-left">
              <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Escolher da biblioteca</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Selecionar uma foto existente</p>
            </div>
          </button>
        </div>

        <div className="p-4 pt-0">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotoSourceSheet;

