
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

export type ThemeOption = 'light' | 'dark' | 'system' | 'auto';

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
  color?: string; // Personal visual setting
  members?: GroupMember[];
}

export interface ShiftPreset {
  id: string;
  code: string; // ex: "NTN"
  start_time: string;
  end_time: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  profile: Profile;
  role: AppRole;
  service_role: ServiceRole;
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

export type RecurrenceType = 'NONE' | 'WEEKLY' | 'BIWEEKLY';