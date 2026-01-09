import React from 'react';
import { Post, Profile } from '../types';
import { MessageCircle, Heart, Share2, MoreHorizontal, MessageSquare } from 'lucide-react';

interface SocialFeedViewProps {
  posts: Post[];
  profiles: Profile[];
  onProfileClick: (profileId: string) => void;
  currentUser: Profile;
}

const SocialFeedView: React.FC<SocialFeedViewProps> = ({ posts, profiles, onProfileClick, currentUser }) => {
  
  const getAuthor = (id: string) => profiles.find(p => p.id === id);

  return (
    <div className="pb-10">
      {/* Feed Header with Chat */}
      <div className="px-5 py-4 flex justify-between items-center bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 sticky top-0 z-10 transition-colors">
        <h2 className="text-xl font-bold text-primaryDark dark:text-slate-100">Rede Nexa</h2>
        <button className="relative p-2 bg-gray-50 dark:bg-slate-800 rounded-full hover:bg-primary/10 transition-colors text-primary dark:text-primaryLight">
          <MessageSquare size={22} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border-2 border-white dark:border-slate-900"></span>
        </button>
      </div>

      {/* Stories / Quick Access (Mock) */}
      <div className="py-4 pl-4 overflow-x-auto no-scrollbar flex space-x-4 border-b border-gray-50 dark:border-slate-800 bg-white dark:bg-slate-900 mb-2 transition-colors">
        <div className="flex flex-col items-center space-y-1 min-w-[64px]">
           <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-emerald-300 p-0.5 cursor-pointer">
              <div className="w-full h-full bg-white dark:bg-slate-800 rounded-full p-0.5">
                <img src={currentUser.avatar_url} className="w-full h-full rounded-full object-cover" alt="Me" />
              </div>
           </div>
           <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Você</span>
        </div>
        {profiles.filter(p => p.id !== currentUser.id).map(profile => (
           <div key={profile.id} className="flex flex-col items-center space-y-1 min-w-[64px]" onClick={() => onProfileClick(profile.id)}>
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-400 to-purple-400 p-0.5 cursor-pointer">
                 <div className="w-full h-full bg-white dark:bg-slate-800 rounded-full p-0.5">
                   <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover" alt={profile.full_name} />
                 </div>
              </div>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate w-16 text-center">{profile.full_name.split(' ')[0]}</span>
           </div>
        ))}
      </div>

      {/* Posts Feed */}
      <div className="space-y-3 px-2">
        {posts.map(post => {
          const author = getAuthor(post.author_id);
          if (!author) return null;

          return (
            <div key={post.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors">
              
              {/* Post Header */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onProfileClick(author.id)}>
                   <img src={author.avatar_url} alt={author.full_name} className="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-slate-700" />
                   <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{author.full_name}</h3>
                      <div className="flex items-center text-xs text-slate-400 space-x-1">
                        <span>{author.specialty || 'Médico'}</span>
                        <span>•</span>
                        <span>2h</span>
                      </div>
                   </div>
                </div>
                <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><MoreHorizontal size={20} /></button>
              </div>

              {/* Content */}
              <div className="px-4 pb-3">
                 {post.type === 'group_join' && (
                    <div className="mb-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded w-fit">
                       Entrou no serviço {post.group_context_name}
                    </div>
                 )}
                 <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{post.content}</p>
                 
                 {post.image_url && (
                   <div className="rounded-xl overflow-hidden mb-2">
                      <img src={post.image_url} alt="Post Content" className="w-full h-auto object-cover max-h-80" />
                   </div>
                 )}
              </div>

              {/* Actions */}
              <div className="px-4 py-3 border-t border-gray-50 dark:border-slate-800 flex items-center justify-between">
                 <div className="flex items-center space-x-6">
                    <button className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 hover:text-error transition-colors group">
                       <Heart size={20} className="group-hover:fill-error" />
                       <span className="text-xs font-medium">{post.likes}</span>
                    </button>
                    <button className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primaryLight transition-colors">
                       <MessageCircle size={20} />
                       <span className="text-xs font-medium">{post.comments}</span>
                    </button>
                    <button className="text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primaryLight transition-colors">
                       <Share2 size={20} />
                    </button>
                 </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SocialFeedView;