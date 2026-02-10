import React, { useState } from 'react';
import { Profile } from '../types';
import { X, Camera, Save, Image as ImageIcon } from 'lucide-react';
import PermissionSoftPrompt from './PermissionSoftPrompt';

const InputGroup = ({ label, value, onChange, textarea, icon }: any) => (
  <div>
    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">{label}</label>
    <div className="relative">
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none min-h-[80px] transition-colors"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
        />
      )}
      {icon && <span className="absolute right-3 top-3 opacity-50 dark:opacity-40">{icon}</span>}
    </div>
  </div>
);

const Edit2Icon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
);

interface EditProfileModalProps {
  profile: Profile;
  onClose: () => void;
  onSave: (updatedProfile: Profile) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ profile, onClose, onSave }) => {
  const [formData, setFormData] = useState<Profile>(profile);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof Profile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handlePhotoClick = () => {
    const hasPermission = localStorage.getItem('nexa_photo_permission_granted');
    if (!hasPermission) {
      setShowPermissionPrompt(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handlePermissionConfirm = () => {
    localStorage.setItem('nexa_photo_permission_granted', 'true');
    setShowPermissionPrompt(false);
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 300);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you would upload to Supabase here. 
      // For now we'll just show the preview to stay within scope of the permission request task.
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-70 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white dark:bg-surface-dark w-full max-w-lg h-[90vh] sm:h-auto sm:max-h-[85vh] sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col shadow-2xl animate-fade-in-up transition-colors">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-surface-dark z-10 transition-colors">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Editar Perfil</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-surface dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-surface/50 dark:bg-background-dark/50 transition-colors">

          <div className="flex flex-col items-center">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
            <div
              onClick={handlePhotoClick}
              className="relative group cursor-pointer"
            >
              <img src={formData.avatar_url} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-sm transition-colors" />
              <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white" />
              </div>
              <div className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full border-2 border-white dark:border-slate-800">
                <Edit2Icon size={12} />
              </div>
            </div>
            <p onClick={handlePhotoClick} className="text-xs text-primary dark:text-primary-light font-bold mt-2 cursor-pointer">Alterar foto</p>
          </div>

          <form id="edit-profile-form" onSubmit={handleSubmit} className="space-y-4">

            <InputGroup label="Nome Completo" value={formData.full_name} onChange={(v: any) => handleChange('full_name', v)} />
            <InputGroup label="Bio (Sobre você)" value={formData.bio || ''} onChange={(v: any) => handleChange('bio', v)} textarea />

            <div className="grid grid-cols-2 gap-4">
              <InputGroup label="CRM" value={formData.crm || ''} onChange={(v: any) => handleChange('crm', v)} />
              <InputGroup label="Especialidade" value={formData.specialty || ''} onChange={(v: any) => handleChange('specialty', v)} />
            </div>

            <InputGroup label="Empresa / Instituição Atual" value={formData.company || ''} onChange={(v: any) => handleChange('company', v)} icon="🏢" />

            <div className="space-y-4 border-t border-gray-200 dark:border-slate-800 pt-4 mt-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wide">Formação Acadêmica</h3>
              <InputGroup label="Graduação (Faculdade)" value={formData.education || ''} onChange={(v: any) => handleChange('education', v)} />
              <InputGroup label="Pós-Graduação / Residência" value={formData.post_grad || ''} onChange={(v: any) => handleChange('post_grad', v)} />

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Título Acadêmico</label>
                <select
                  value={formData.academic_title || 'Nenhum'}
                  onChange={(e) => handleChange('academic_title', e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
                >
                  <option value="Nenhum">Nenhum</option>
                  <option value="Mestrado">Mestrado</option>
                  <option value="Doutorado">Doutorado</option>
                  <option value="PhD">PhD</option>
                </select>
              </div>
            </div>

            {/* Privacy Toggles */}
            <div className="pt-4 border-t border-gray-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wide mb-3">Privacidade</h3>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 transition-colors">
                <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Perfil visível para colegas fora dos serviços</span>
                <div className="w-10 h-6 bg-primary rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-surface-dark transition-colors">
          <button
            type="submit"
            form="edit-profile-form"
            className="w-full bg-primary text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-200 dark:shadow-none hover:bg-primary-dark transition-colors flex items-center justify-center space-x-2"
          >
            <Save size={18} />
            <span>Salvar Alterações</span>
          </button>
        </div>

      </div>
      <PermissionSoftPrompt
        isOpen={showPermissionPrompt}
        onConfirm={handlePermissionConfirm}
        title="Acesso à Galeria e Câmera"
        description="Para que você possa personalizar seu perfil com uma foto, o NexaEscala precisa de acesso à sua galeria ou câmera."
        icon={ImageIcon}
        confirmText="Continuar"
      />
    </div>
  );
};

export default EditProfileModal;