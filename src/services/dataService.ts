import { AppRole, Profile, GroupMember, Shift, ShiftAssignment, ActivityLog, Group, Post, ServiceRole, FinancialConfig, FinancialRecord, PaymentModel, ContractType } from '../types';

// MOCK DATA

export const MOCK_PROFILES: Profile[] = [
  {
    id: 'p1',
    full_name: 'Dr. João Silva',
    crm: '12345-SP',
    avatar_url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80',
    phone: '1199999999',
    specialty: 'Cardiologia',
    company: 'Hospital Sírio-Libanês',
    education: 'USP - Universidade de São Paulo',
    academic_title: 'Doutorado',
    bio: 'Apaixonado por medicina intensiva e pesquisa clínica.',
    followers_count: 1240,
    following_count: 450,
    is_following: true
  },
  {
    id: 'p2',
    full_name: 'Dra. Kamylla de Fatima',
    crm: '67890-SP',
    avatar_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80',
    phone: '1198888888',
    specialty: 'Pediatria',
    company: 'Hospital Infantil Sabará',
    education: 'UNIFESP',
    post_grad: 'UTI Pediátrica',
    academic_title: 'Mestrado',
    bio: 'Pediatra intensivista. Sempre em busca de inovações para o cuidado infantil.',
    followers_count: 890,
    following_count: 320
  },
  {
    id: 'p3',
    full_name: 'Gestor Carlos',
    crm: '11223-SP',
    avatar_url: 'https://images.unsplash.com/photo-1537368910025-bc005fbede68?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80',
    phone: '1197777777',
    specialty: 'Gestão Hospitalar',
    company: 'Rede D\'Or',
    education: 'FGV - Gestão em Saúde',
    academic_title: 'Nenhum',
    followers_count: 2100,
    following_count: 150,
    is_following: false
  },
  {
    id: 'p4',
    full_name: 'Dr. Jorge Campelo',
    crm: '44556-SP',
    avatar_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80',
    phone: '1196666666',
    specialty: 'Ortopedia',
    company: 'Santa Casa',
    education: 'Santa Casa de SP',
    academic_title: 'Nenhum',
    bio: 'Ortopedia e Traumatologia. Foco em medicina esportiva.',
    followers_count: 500,
    following_count: 600,
    is_following: false
  },
];

export const MOCK_POSTS: Post[] = [
  {
    id: 'post1',
    author_id: 'p1',
    content: 'Acabei de entrar no serviço UPA SOBRAL - FLEX. Animado para trabalhar com essa equipe!',
    type: 'group_join',
    group_context_name: 'UPA SOBRAL - FLEX',
    likes: 12,
    comments: 2,
    created_at: '2023-10-24T09:00:00'
  },
  {
    id: 'post2',
    author_id: 'p4',
    content: 'Plantão tranquilo hoje na Santa Casa. Aproveitando para atualizar os prontuários.',
    image_url: 'https://images.unsplash.com/photo-1516574187841-693083f7e496?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    type: 'image',
    likes: 45,
    comments: 8,
    created_at: '2023-10-23T18:30:00'
  },
  {
    id: 'post3',
    author_id: 'p3',
    content: 'Atenção colegas: Nova diretriz de sepse publicada. Vale a leitura!',
    type: 'text',
    likes: 89,
    comments: 15,
    created_at: '2023-10-22T14:15:00'
  }
];

export const MOCK_GROUPS: Group[] = [
  {
    id: 'g1',
    name: 'UPA SOBRAL - FLEX',
    institution: 'UPA - Unidade de Pronto Atendimento, Sobral',
    member_count: 46,
    unread_messages: 2,
    user_role: ServiceRole.PLANTONISTA
  },
  {
    id: 'g2',
    name: 'HSC - PRONTO ATENDIMENTO',
    institution: 'HOSPITAL SÃO CAMILO - Unidade Pompeia',
    member_count: 81,
    unread_messages: 0,
    user_role: ServiceRole.ADMIN
  },
  {
    id: 'g3',
    name: 'PREV MEDICA',
    institution: 'CASA DE SAÚDE SÃO JOSÉ',
    member_count: 15,
    unread_messages: 5,
    user_role: ServiceRole.ADMIN_AUX
  },
  {
    id: 'g4',
    name: 'UPA SOBRAL - CHEFE',
    institution: 'UPA - Unidade de Pronto Atendimento, Sobral',
    member_count: 23,
    unread_messages: 0,
    user_role: ServiceRole.VISITANTE
  },
];

export const MOCK_MEMBERS: GroupMember[] = [
  { id: 'm1', group_id: 'g1', profile: MOCK_PROFILES[0], role: AppRole.MEDICO, service_role: ServiceRole.PLANTONISTA },
  { id: 'm2', group_id: 'g1', profile: MOCK_PROFILES[1], role: AppRole.MEDICO, service_role: ServiceRole.PLANTONISTA },
];

export const MOCK_LOGS: ActivityLog[] = [
  { id: 'l1', action_type: 'SHIFT_ASSIGN', details: 'Dr. João assumiu o plantão de 12/10.', created_at: '2023-10-01T10:00:00', actor_profile: MOCK_PROFILES[0] },
  { id: 'l2', action_type: 'SHIFT_SWAP', details: 'Dra. Kamylla trocou com Dr. Pedro (15/10).', created_at: '2023-10-05T14:30:00', actor_profile: MOCK_PROFILES[1] },
];

// --- FINANCIAL MOCK DATA ---

// This maps a group to a user's financial configuration
export const MOCK_FINANCIAL_CONFIGS: Record<string, FinancialConfig> = {
  'g1': {
    group_id: 'g1',
    contract_type: ContractType.PJ_PRIVATE,
    payment_model: PaymentModel.MIXED,
    fixed_value: 1200,
    production_value_unit: 40,
    tax_percent: 16.33
  },
  'g2': {
    group_id: 'g2',
    contract_type: ContractType.CLT_PUBLIC,
    payment_model: PaymentModel.FIXED,
    fixed_value: 1500,
    production_value_unit: 0,
    tax_percent: 11 // INSS approx
  }
};

// Generate Mock Financial Records from Shifts
const generateFinancialRecords = (): FinancialRecord[] => {
  const records: FinancialRecord[] = [];
  const today = new Date();

  // Create past records for the last 2 months
  for (let i = 0; i < 15; i++) {
    const isG1 = i % 2 === 0;
    const config = isG1 ? MOCK_FINANCIAL_CONFIGS['g1'] : MOCK_FINANCIAL_CONFIGS['g2'];
    const groupName = isG1 ? MOCK_GROUPS[0].name : MOCK_GROUPS[1].name;

    // Random past date
    const date = new Date(today);
    date.setDate(date.getDate() - (i * 3));
    const dateStr = date.toISOString().split('T')[0];

    const fixed = config.fixed_value;
    const prodQty = config.payment_model === PaymentModel.MIXED ? Math.floor(Math.random() * 20) : 0;
    const prodEarn = prodQty * config.production_value_unit;
    const extras = Math.random() > 0.8 ? 350 : 0; // Occasional extra

    const gross = fixed + prodEarn + extras;
    const net = gross * (1 - (config.tax_percent / 100));

    records.push({
      id: `fr_${i}`,
      shift_id: `s_past_${i}`,
      date: dateStr,
      group_name: groupName,
      fixed_earnings: fixed,
      production_quantity: prodQty,
      production_earnings: prodEarn,
      extras_value: extras,
      extras_description: extras > 0 ? 'Procedimento Particular' : undefined,
      gross_total: gross,
      net_total: net,
      is_paid: i > 5, // First 5 are pending, rest paid
      paid_at: i > 5 ? dateStr : undefined
    });
  }
  return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const MOCK_FINANCIAL_RECORDS = generateFinancialRecords();

// Generate Shifts for current month
const generateShifts = (): { shifts: Shift[], assignments: ShiftAssignment[] } => {
  const shifts: Shift[] = [];
  const assignments: ShiftAssignment[] = [];
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const groups = ['g1', 'g2'];

  for (let i = 1; i <= daysInMonth; i++) {
    const dayString = i.toString().padStart(2, '0');
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${dayString}`;

    // Randomly assign a group to shifts
    const groupId = groups[i % 2];
    const groupName = MOCK_GROUPS.find(g => g.id === groupId)?.name || 'Hospital';

    const shiftId = `s_${dateStr}_d`;

    // Not every day has a shift for demo purposes, but let's populate well
    if (i % 2 === 0 || i % 3 === 0) {

      // Every 4th entry will be a night shift (19:00 - 07:00)
      const isNightShift = i % 4 === 0;

      shifts.push({
        id: shiftId,
        group_id: groupId,
        date: dateStr,
        start_time: isNightShift ? '19:00' : '07:00',
        end_time: isNightShift ? '07:00' : '19:00',
        quantity_needed: 2,
        is_published: true,
        institution_name: groupName
      });

      // Assignments
      assignments.push({
        id: `a_${shiftId}_1`,
        shift_id: shiftId,
        profile_id: 'p2', // Kamylla
        is_confirmed: true,
        profile: MOCK_PROFILES[1]
      });

      if (Math.random() > 0.5) {
        assignments.push({
          id: `a_${shiftId}_2`,
          shift_id: shiftId,
          profile_id: 'p4', // Jorge
          is_confirmed: true,
          profile: MOCK_PROFILES[3]
        });
      }
    }
  }

  return { shifts, assignments };
};

export const { shifts: INITIAL_SHIFTS, assignments: INITIAL_ASSIGNMENTS } = generateShifts();