// ... imports
import { Search } from 'lucide-react';
import { GroupMember } from '../../types';

interface EditorMemberSidebarProps {
    members: GroupMember[];
    onDragStart?: (member: GroupMember) => void;
    selectedMember?: GroupMember | null;
    onSelectMember?: (member: GroupMember) => void;
}

const EditorMemberSidebar: React.FC<EditorMemberSidebarProps> = ({ members, onDragStart, selectedMember, onSelectMember }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredMembers = members.filter(m =>
        m.profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.profile.crm?.includes(searchTerm)
    );

    return (
        <div className="w-full md:w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full shrink-0 z-20 shadow-xl">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1">Membros</h3>
                <p className="text-xs text-slate-500">
                    <span className="md:hidden">Toque para selecionar</span>
                    <span className="hidden md:inline">Arraste para escalar</span>
                </p>

                {/* Search */}
                <div className="mt-4 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                        type="text"
                        placeholder="Buscar médico..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {filteredMembers.map(member => {
                    const isSelected = selectedMember?.id === member.id;
                    return (
                        <div
                            key={member.id}
                            draggable
                            onDragStart={(e) => {
                                e.dataTransfer.setData('memberId', member.id);
                                onDragStart?.(member);
                            }}
                            onClick={() => onSelectMember?.(member)}
                            className={`group flex items-center gap-3 p-3 rounded-xl border cursor-pointer md:cursor-grab active:cursor-grabbing transition-all
                                ${isSelected
                                    ? 'bg-primary/10 border-primary shadow-sm ring-1 ring-primary/20'
                                    : 'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                                }
                            `}
                        >
                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0">
                                <img src={member.profile.avatar_url} alt={member.profile.full_name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className={`text-sm font-bold truncate ${isSelected ? 'text-primary' : 'text-slate-700 dark:text-slate-200'}`}>{member.profile.full_name}</h4>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-400 font-medium">CRM {member.profile.crm || '---'}</span>
                                    {/* Stats Badge (Mock) */}
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 font-bold">
                                        0h
                                    </span>
                                </div>
                            </div>

                            {/* Selection Indicator */}
                            {isSelected && (
                                <div className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default EditorMemberSidebar;
