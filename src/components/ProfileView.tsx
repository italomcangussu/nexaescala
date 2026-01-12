import React from 'react';
import { Profile } from '../types';
import { ArrowLeft, Briefcase, GraduationCap, Award, Users, Check, Edit2 } from 'lucide-react';

interface ProfileViewProps {
   profile: Profile;
   currentUser: Profile;
   onBack: () => void;
   onEdit: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ profile, currentUser, onBack, onEdit }) => {

   const isMe = profile.id === currentUser.id;

   // Mock follow state
   const [isFollowing, setIsFollowing] = React.useState(profile.is_following);

   const handleFollow = () => {
      setIsFollowing(!isFollowing);
      // In a real app, emit event to update database
      if (!isFollowing) {
         alert(`Solicitação enviada para ${profile.full_name}`);
      }
   };

   return (
      <div className="fixed inset-0 bg-background dark:bg-slate-950 z-[60] overflow-y-auto flex flex-col animate-fade-in-up transition-colors duration-300">

         {/* Header Image - Taller and safe area aware */}
         <div className="h-48 bg-gradient-to-r from-emerald-600 to-teal-500 relative shrink-0">
            <div className="absolute top-0 left-0 w-full p-4 pt-12 flex justify-between items-start">
               <button onClick={onBack} className="p-2.5 bg-black/20 text-white rounded-full backdrop-blur-md hover:bg-black/30 transition-colors active:scale-95">
                  <ArrowLeft size={24} />
               </button>

               {isMe && (
                  <button onClick={onEdit} className="p-2.5 bg-black/20 text-white rounded-full backdrop-blur-md hover:bg-black/30 transition-colors active:scale-95">
                     <Edit2 size={20} />
                  </button>
               )}
            </div>
         </div>

         {/* Profile Info Card - Adjusted overlap */}
         <div className="flex-1 -mt-16 px-4 pb-20">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800 p-6 pt-0 relative flex flex-col items-center transition-colors">

               {/* Avatar - Centered and overlapping */}
               <div className="-mt-16 mb-4 relative">
                  <div className="w-32 h-32 rounded-full p-1.5 bg-white dark:bg-slate-900 shadow-xl transition-colors">
                     <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full rounded-full object-cover" />
                  </div>
                  {isMe && (
                     <div className="absolute bottom-1 right-1 bg-primary text-white p-2 rounded-full border-4 border-white dark:border-slate-900 shadow-sm cursor-pointer hover:bg-primaryDark transition-colors" onClick={onEdit}>
                        <Edit2 size={14} />
                     </div>
                  )}
               </div>

               {/* Names */}
               <div className="text-center w-full mb-6">
                  <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-tight">{profile.full_name}</h1>
                  <p className="text-base text-primary dark:text-primaryLight font-semibold mt-1">{profile.specialty || 'Médico Generalista'}</p>

                  <div className="flex flex-wrap justify-center gap-2 mt-3">
                     <span className="text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                        {profile.crm || 'CRM Pendente'}
                     </span>
                     {profile.academic_title && profile.academic_title !== 'Nenhum' && (
                        <span className="text-xs text-amber-700 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-900/30 px-3 py-1 rounded-full border border-amber-100 dark:border-amber-800/50">
                           {profile.academic_title}
                        </span>
                     )}
                  </div>
               </div>

               {/* Stats */}
               <div className="w-full grid grid-cols-3 gap-2 py-4 border-t border-b border-slate-50 dark:border-slate-800 mb-6 transition-colors">
                  <div className="text-center p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                     <span className="block text-xl font-bold text-slate-800 dark:text-slate-100">{profile.followers_count}</span>
                     <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">Seguidores</span>
                  </div>
                  <div className="text-center p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                     <span className="block text-xl font-bold text-slate-800 dark:text-slate-100">{profile.following_count}</span>
                     <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">Seguindo</span>
                  </div>
                  <div className="text-center p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                     <span className="block text-xl font-bold text-slate-800 dark:text-slate-100">{isMe ? '0' : '12'}</span>
                     <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">Em Comum</span>
                  </div>
               </div>

               {/* Bio */}
               {profile.bio && (
                  <div className="mb-8 text-center px-2">
                     <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium italic">
                        "{profile.bio}"
                     </p>
                  </div>
               )}

               {/* Main Action Button */}
               <div className="w-full">
                  {isMe ? (
                     <button onClick={onEdit} className="w-full py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95 shadow-sm">
                        Editar Perfil Completo
                     </button>
                  ) : (
                     <button
                        onClick={handleFollow}
                        className={`w-full py-3.5 font-bold rounded-2xl transition-all flex items-center justify-center space-x-2 active:scale-95 ${isFollowing ? 'bg-white dark:bg-slate-800 border-2 border-primary text-primary dark:text-primaryLight' : 'bg-primary text-white shadow-lg shadow-emerald-200 dark:shadow-none hover:shadow-emerald-300'}`}
                     >
                        {isFollowing ? (
                           <>
                              <Check size={20} />
                              <span>Você já segue</span>
                           </>
                        ) : (
                           <>
                              <Users size={20} />
                              <span>Seguir Colega</span>
                           </>
                        )}
                     </button>
                  )}
               </div>
            </div>

            {/* Details Section */}
            <div className="mt-6 space-y-4 px-1 pb-10">
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2">Informações</h3>
               <InfoCard icon={<Briefcase size={20} />} title="Empresa / Instituição" value={profile.company || 'Não informado'} />
               <InfoCard icon={<GraduationCap size={20} />} title="Formação Acadêmica" value={profile.education || 'Não informado'} />
               {profile.post_grad && <InfoCard icon={<Award size={20} />} title="Pós-Graduação" value={profile.post_grad} />}
            </div>
         </div>
      </div>
   );
};

const InfoCard = ({ icon, title, value }: { icon: React.ReactNode, title: string, value: string }) => (
   <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center space-x-4 shadow-sm hover:shadow-md transition-all">
      <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
         {icon}
      </div>
      <div>
         <p className="text-xs text-slate-400 uppercase font-bold tracking-wide">{title}</p>
         <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight mt-0.5">{value}</p>
      </div>
   </div>
);

export default ProfileView;