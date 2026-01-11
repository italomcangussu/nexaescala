
export enum AppRole {
  GESTOR = 'gestor',
  AUXILIAR = 'auxiliar',
  MEDICO = 'medico',
  OBSERVADOR = 'observador',
  PLANTONISTA = 'plantonista'
}

export enum ServiceRole {
  ADMIN = 'STAFF',
  ADMIN_AUX = 'STAFF_AUX',
  PLANTONISTA = 'PLANTONISTA',
  VISITANTE = 'VISITANTE'
}

export type ThemeOption = 'light';

export enum TradeStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

export enum TradeType {
  DIRECT_SWAP = 'DIRECT_SWAP',
  GIVEAWAY = 'GIVEAWAY'
}

// --- FINANCE MODULE TYPES ---

export enum PaymentModel {
  FIXED = 'FIXED', // Apenas valor fixo
  PRODUCTION = 'PRODUCTION', // Apenas produção
  MIXED = 'MIXED' // Fixo + Produção
}

export enum ContractType {
  CLT_PUBLIC = 'CLT_PUBLIC',
  PJ_PRIVATE = 'PJ_PRIVATE'
}

export interface FinancialConfig {
  group_id: string;
  contract_type: ContractType;
  payment_model: PaymentModel;
  fixed_value: number; // Valor bruto do plantão/hora
  production_value_unit: number; // Valor por paciente/procedimento
  tax_percent: number; // % de desconto (impostos, taxa coop)
}

export interface FinancialRecord {
  id: string;
  user_id?: string;
  shift_id: string;
  date: string; // YYYY-MM-DD
  group_name: string;

  // Values
  fixed_earnings: number;
  production_quantity: number;
  production_earnings: number;
  extras_value: number;
  extras_description?: string;

  gross_total: number;
  net_total: number; // Estimated liquid

  is_paid: boolean; // Checkbox status
  paid_at?: string;
}

// ----------------------------

export interface Profile {
  id: string;
  full_name: string;
  crm?: string;
  avatar_url: string;
  push_subscription?: string; // JSON string of PushSubscription
  updated_at?: string;
  phone?: string;
  email?: string;

  // New Social/Professional Fields
  specialty?: string;
  company?: string;
  education?: string; // Formação base
  post_grad?: string; // Pós
  academic_title?: 'Nenhum' | 'Mestrado' | 'Doutorado' | 'PhD';
  bio?: string;

  // Social Stats
  followers_count?: number;
  following_count?: number;
  common_followers?: number; // Mock for UI
  is_following?: boolean; // Contextual for current user

  // Privacy Settings (Mock)
  privacy?: {
    show_phone: boolean;
    show_education: boolean;
  };

  // Onboarding flag
  onboarding_completed?: boolean;
}

export interface Post {
  id: string;
  author_id: string;
  content: string;
  image_url?: string;
  likes: number;
  comments: number;
  created_at: string;
  type: 'text' | 'image' | 'group_join';
  group_context_name?: string; // If related to a group
}

export interface Group {
  id: string;
  name: string;
  institution: string;
  member_count: number;
  unread_messages: number;
  user_role: ServiceRole; // Role of current user in this group
  color?: string; // Personal color preference for this user (from group_members.personal_color, defaults to #10b981)
  has_seen_color_banner?: boolean; // Whether user has seen the color picker banner
  members?: GroupMember[];
}

export interface ShiftPreset {
  id: string;
  group_id?: string; // FK to groups table
  code: string; // ex: "NTN"
  start_time: string;
  end_time: string;
  quantity_needed?: number;
  days_of_week?: number[]; // 0=Sun, 6=Sat
}

export interface GroupMember {
  id: string;
  group_id: string;
  profile: Profile;
  role: AppRole;
  service_role: ServiceRole;
  service_roles?: ServiceRole[]; // Multiple roles support
  personal_color?: string; // User's custom color for this service
  has_seen_color_banner?: boolean; // Whether user has dismissed the color banner
}

// --- SERVICE EDITOR TYPES ---

export interface TeamMember {
  profile: Profile;
  roles: ServiceRole[]; // Múltiplas roles por membro
  isOwner: boolean;
}

export type ServiceEditorMode = 'create' | 'edit';

export interface MonthOption {
  year: number;
  month: number; // 0-indexed
  label: string;
  selected: boolean;
}

export interface ServiceEditorState {
  mode: ServiceEditorMode;
  groupId?: string;
  step: number;

  // Step 1: Info
  serviceName: string;
  institution: string;
  color: string;

  // Step 2: Shifts
  shiftPresets: ShiftPreset[];

  // Step 3: Team
  team: TeamMember[];

  // Step 4: Generation
  selectedMonths: MonthOption[];
  quantityPerShift: number;

  // UI State
  isSaving: boolean;
  showCompletion: boolean;
  createdGroup: Group | null;

  // Search
  searchQuery: string;
  searchResults: Profile[];
  isSearching: boolean;

  // Institution Modal
  instSearch: string;
  instSearchResults: string[];
  showInstitutionModal: boolean;
  showNewInstForm: boolean;
  instForm: {
    name: string;
    city: string;
    state: string;
    phone: string;
  };

  // Shift Modal
  showShiftModal: boolean;
  editingShift: Partial<ShiftPreset> | null;

  // Validation
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

export interface Shift {
  id: string;
  group_id: string;
  date: string; // YYYY-MM-DD
  start_time: string;
  end_time: string;
  quantity_needed: number;
  is_published: boolean;
  institution_name?: string; // For UI
  code?: string; // Shift Code (e.g. DT, NT)
  is_individual?: boolean; // Flag for individual day scale
}

export interface ShiftAssignment {
  id: string;
  shift_id: string;
  profile_id: string;
  is_confirmed: boolean;
  profile?: Profile; // Hydrated for UI
}

// ... (existing code)

export interface ActivityLog {
  id: string;
  action_type: string; // 'SHIFT_SWAP', 'MEMBER_ADDED', etc.
  details: string;
  created_at: string;
  actor_profile: Profile;
}

export interface ShiftExchange {
  id: string;
  group_id: string;
  type: TradeType;
  status: TradeStatus;

  requesting_profile_id: string;
  target_profile_id?: string | null;

  offered_shift_assignment_id: string;
  requested_shift_assignment_id?: string | null;

  created_at: string;

  // Hydrated fields for UI
  requesting_profile?: Profile;
  target_profile?: Profile;
  offered_shift?: ShiftAssignment & { shift: Shift };
  requested_shift?: ShiftAssignment & { shift: Shift };
}

// UI specific types
export interface DayCellData {
  date: string;
  shifts: Shift[];
  assignments: ShiftAssignment[];
}

// Chat Types
export type MessageType = 'TEXT' | 'SHIFT_OFFER' | 'SHIFT_SWAP';

export interface ChatMessage {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  metadata?: any;
  created_at: string;
  sender?: Profile; // Joined
}
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'SHIFT_PUBLISHED' | 'SHIFT_SWAP' | 'SYSTEM';
  is_read: boolean;
  created_at: string;
  metadata?: any;
}

export type RecurrenceType = 'NONE' | 'WEEKLY' | 'BIWEEKLY';

export interface GroupRelationship {
  id: string;
  source_group_id: string;
  related_group_id: string;
  relationship_type: string; // 'related', etc.
  display_label: string | null;
  related_group?: Group; // Hydrated
}