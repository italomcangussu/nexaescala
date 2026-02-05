import { supabase } from '../../lib/supabase';
import { ShiftExchange, ShiftExchangeRequest, Shift, TradeStatus, TradeType, Notification } from '../../types';
import { sanitizeFilterValue } from './validation';
import { createNotificationsBulk, sendPushToUsers } from './notifications';

// --- SHIFT EXCHANGES ---

export const createShiftExchange = async (exchange: Partial<ShiftExchange>): Promise<void> => {
    const { data: existing } = await supabase
        .from('shift_exchanges')
        .select('id')
        .eq('offered_shift_assignment_id', exchange.offered_shift_assignment_id)
        .eq('status', 'PENDING')
        .maybeSingle();

    if (existing) {
        throw new Error('Já existe um pedido de repasse pendente para este plantão.');
    }

    const { data, error } = await supabase
        .from('shift_exchanges')
        .insert(exchange)
        .select()
        .single();

    if (error) throw error;

    if (exchange.type === TradeType.GIVEAWAY) {
        if (exchange.target_profile_id) {
            await createNotificationsBulk([{
                user_id: exchange.target_profile_id,
                title: 'Repasse de Plantão Recebido',
                message: 'Um colega repassou um plantão diretamente para você.',
                type: 'SHIFT_OFFER',
                is_read: false,
                metadata: { exchange_id: data.id }
            }]);
            await sendPushToUsers([exchange.target_profile_id], 'SHIFT_OFFER', 'Repasse de Plantão Recebido', 'Um colega repassou um plantão diretamente para você.');
        } else {
            const { data: members } = await supabase
                .from('group_members')
                .select('profile_id')
                .eq('group_id', exchange.group_id);

            if (members && members.length > 0) {
                const otherMembers = members.filter(m => m.profile_id !== exchange.requesting_profile_id);

                if (otherMembers.length > 0) {
                    const notifications = otherMembers.map(m => ({
                        user_id: m.profile_id,
                        title: 'Oportunidade de Plantão',
                        message: 'Um colega ofertou um plantão para o grupo.',
                        type: 'SHIFT_OFFER',
                        is_read: false,
                        metadata: { exchange_id: data.id }
                    }));
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    await createNotificationsBulk(notifications as any);
                    const pushIds = otherMembers.map(m => m.profile_id);
                    await sendPushToUsers(pushIds, 'SHIFT_OFFER', 'Oportunidade de Plantão', 'Um colega ofertou um plantão para o grupo.');
                }
            }
        }
    }
};

export const cancelShiftExchange = async (exchangeId: string): Promise<void> => {
    const { data: exchange } = await supabase
        .from('shift_exchanges')
        .select('target_profile_id')
        .eq('id', exchangeId)
        .single();

    if (exchange?.target_profile_id) {
        await createNotificationsBulk([{
            user_id: exchange.target_profile_id,
            title: 'Solicitação Cancelada',
            message: 'Um colega cancelou a solicitação de repasse/troca que enviou para você.',
            type: 'SHIFT_OFFER',
            is_read: false,
            metadata: { exchange_id: exchangeId }
        }]);
        await sendPushToUsers([exchange.target_profile_id], 'SHIFT_OFFER', 'Solicitação Cancelada', 'Um colega cancelou a solicitação de repasse/troca que enviou para você.');
    }

    const { error } = await supabase
        .from('shift_exchanges')
        .update({ status: TradeStatus.CANCELLED })
        .eq('id', exchangeId)
        .eq('status', 'PENDING');

    if (error) throw error;
};

export const respondToShiftExchange = async (
    exchangeId: string,
    action: 'ACCEPT' | 'REJECT',
    targetUserId: string
): Promise<void> => {
    const { data: exchange, error: fetchError } = await supabase
        .from('shift_exchanges')
        .select('*')
        .eq('id', exchangeId)
        .single();

    if (fetchError) throw fetchError;
    if (!exchange) throw new Error('Repasse/Troca não encontrada.');

    if (action === 'ACCEPT') {
        await executeExchangeTransaction(exchange, targetUserId);
    } else {
        if (exchange.target_profile_id === targetUserId) {
            const { error: updateExchangeError } = await supabase
                .from('shift_exchanges')
                .update({ status: TradeStatus.REJECTED })
                .eq('id', exchangeId);

            if (updateExchangeError) throw updateExchangeError;

            await createNotificationsBulk([{
                user_id: exchange.requesting_profile_id,
                title: 'Repasse Recusado',
                message: 'Um colega recusou o seu repasse direcionado.',
                type: 'SHIFT_OFFER',
                is_read: false,
                metadata: { exchange_id: exchangeId }
            }]);
            await sendPushToUsers([exchange.requesting_profile_id], 'SHIFT_OFFER', 'Repasse Recusado', 'Um colega recusou o seu repasse direcionado.');
        }
    }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getShiftExchanges = async (groupId: string): Promise<ShiftExchange[]> => {
    const { data, error } = await supabase
        .from('shift_exchanges')
        .select(`
            *,
            requesting_profile: profiles!requesting_profile_id(*),
            target_profile: profiles!target_profile_id(*),
            offered_shift: shift_assignments!offered_shift_assignment_id(
                id,
                shift: shifts(*)
            ),
            requested_shift: shift_assignments!requested_shift_assignment_id(
                id,
                shift: shifts(*)
            )
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data as any;
};

export const getUserShiftExchanges = async (userId: string): Promise<ShiftExchange[]> => {
    const uid = sanitizeFilterValue(userId);
    const { data, error } = await supabase
        .from('shift_exchanges')
        .select(`
            *,
            requesting_profile: profiles!requesting_profile_id(*),
            target_profile: profiles!target_profile_id(*),
            offered_shift: shift_assignments!offered_shift_assignment_id(
                id,
                shift: shifts(*)
            ),
            requested_shift: shift_assignments!requested_shift_assignment_id(
                id,
                shift: shifts(*)
            )
        `)
        .or(`requesting_profile_id.eq.${uid},target_profile_id.eq.${uid}`)
        .order('created_at', { ascending: false });

    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data as any;
};

export const getServiceExchangeHistory = async (groupId: string): Promise<ShiftExchange[]> => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    const thirtyDaysAgo = date.toISOString();

    const { data, error } = await supabase
        .from('shift_exchanges')
        .select(`
            *,
            requesting_profile: profiles!requesting_profile_id(*),
            target_profile: profiles!target_profile_id(*),
            offered_shift: shift_assignments!offered_shift_assignment_id(
                id,
                shift: shifts(*)
            ),
            requested_shift: shift_assignments!requested_shift_assignment_id(
                id,
                shift: shifts(*)
            )
        `)
        .eq('group_id', groupId)
        .eq('status', 'ACCEPTED')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false });

    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data as any;
};

export const updateShiftExchangeStatus = async (exchangeId: string, status: TradeStatus): Promise<void> => {
    const { data: exchange } = await supabase
        .from('shift_exchanges')
        .select('requesting_profile_id, type')
        .eq('id', exchangeId)
        .single();

    const { error } = await supabase
        .from('shift_exchanges')
        .update({ status })
        .eq('id', exchangeId);

    if (error) throw error;

    if (status === TradeStatus.REJECTED && exchange) {
        await createNotificationsBulk([{
            user_id: exchange.requesting_profile_id,
            title: exchange.type === TradeType.DIRECT_SWAP ? 'Troca Recusada' : 'Repasse Recusado',
            message: 'Sua solicitação de plantão foi recusada.',
            type: 'SHIFT_OFFER',
            is_read: false,
            metadata: { exchange_id: exchangeId }
        }]);
        const rejectTitle = exchange.type === TradeType.DIRECT_SWAP ? 'Troca Recusada' : 'Repasse Recusado';
        await sendPushToUsers([exchange.requesting_profile_id], 'SHIFT_OFFER', rejectTitle, 'Sua solicitação de plantão foi recusada.');
    }
};

export async function executeExchangeTransaction(exchange: ShiftExchange, acceptingUserId?: string): Promise<void> {
    const finalTargetId = exchange.type === TradeType.DIRECT_SWAP || exchange.target_profile_id
        ? exchange.target_profile_id
        : acceptingUserId;

    if (!finalTargetId) {
        throw new Error("Target user not identified for exchange.");
    }

    if (exchange.type === TradeType.GIVEAWAY) {
        // Use atomic function with history tracking
        const { error } = await supabase.rpc('execute_giveaway_atomic', {
            p_assignment_id: exchange.offered_shift_assignment_id,
            p_new_profile_id: finalTargetId,
            p_exchange_id: exchange.id,
            p_change_type: 'GIVEAWAY'
        });
        if (error) throw error;
    } else if (exchange.type === TradeType.DIRECT_SWAP && exchange.requested_shift_assignment_id) {
        // Use atomic swap function with history tracking
        const { error } = await supabase.rpc('execute_shift_swap_atomic', {
            p_assignment_1_id: exchange.offered_shift_assignment_id,
            p_assignment_2_id: exchange.requested_shift_assignment_id,
            p_user_1_id: exchange.requesting_profile_id,
            p_user_2_id: finalTargetId,
            p_exchange_id: exchange.id,
            p_exchange_request_id: null,
            p_change_type: 'SWAP'
        });
        if (error) throw error;
    }

    const { error } = await supabase
        .from('shift_exchanges')
        .update({
            status: TradeStatus.ACCEPTED,
            target_profile_id: finalTargetId,
            updated_at: new Date().toISOString()
        })
        .eq('id', exchange.id);

    if (error) throw error;

    await createNotificationsBulk([{
        user_id: exchange.requesting_profile_id,
        title: exchange.type === TradeType.DIRECT_SWAP ? 'Troca Confirmada!' : 'Repasse Aceito!',
        message: exchange.type === TradeType.DIRECT_SWAP
            ? 'Sua solicitação de troca de plantão foi concluída com sucesso.'
            : 'Um colega aceitou o seu repasse de plantão.',
        type: 'SHIFT_OFFER',
        is_read: false,
        metadata: { exchange_id: exchange.id }
    }]);
    const execTitle = exchange.type === TradeType.DIRECT_SWAP ? 'Troca Confirmada!' : 'Repasse Aceito!';
    const execMsg = exchange.type === TradeType.DIRECT_SWAP
        ? 'Sua solicitação de troca de plantão foi concluída com sucesso.'
        : 'Um colega aceitou o seu repasse de plantão.';
    await sendPushToUsers([exchange.requesting_profile_id], 'SHIFT_OFFER', execTitle, execMsg);
}

// --- SHIFT OFFER ---

export const createShiftOffer = async (
    shiftId: string,
    requestingProfileId: string,
    note?: string
): Promise<void> => {
    const { data: shift, error: shiftError } = await supabase
        .from('shifts')
        .select(`
            *,
            group:groups(id, name, owner_id)
        `)
        .eq('id', shiftId)
        .single();

    if (shiftError) throw shiftError;

    const { error: insertError } = await supabase
        .from('shift_exchanges')
        .insert({
            shift_id: shiftId,
            requesting_profile_id: requestingProfileId,
            status: 'PENDING',
            note: note
        });

    if (insertError) throw insertError;

    const { data: admins, error: adminError } = await supabase
        .from('group_members')
        .select('profile_id')
        .eq('group_id', shift.group_id)
        .in('service_role', ['ADMIN', 'ADMIN_AUX']);

    if (!adminError && admins && admins.length > 0) {
        const adminIds = admins.map(a => a.profile_id);

        const notifications: Partial<Notification>[] = adminIds.map(adminId => ({
            user_id: adminId,
            title: 'Nova Oferta de Plantão',
            message: `Um membro ofertou um plantão no serviço ${shift.group.name}.`,
            type: 'SHIFT_OFFER',
            link: `/services/${shift.group.id}?tab=notifications`,
            is_read: false
        }));

        await createNotificationsBulk(notifications);
    }
};

// --- PEER-TO-PEER SHIFT EXCHANGE REQUESTS ---

export const createShiftExchangeRequest = async (
    groupId: string,
    requestingUserId: string,
    targetUserId: string,
    offeredShiftId: string,
    requestedShiftOptions: string[]
): Promise<ShiftExchangeRequest> => {
    if (requestedShiftOptions.length < 1 || requestedShiftOptions.length > 3) {
        throw new Error('Você deve selecionar entre 1 e 3 opções de plantão.');
    }

    const { data, error } = await supabase
        .from('shift_exchange_requests')
        .insert({
            group_id: groupId,
            requesting_user_id: requestingUserId,
            target_user_id: targetUserId,
            offered_shift_id: offeredShiftId,
            requested_shift_options: requestedShiftOptions,
            status: 'PENDING'
        })
        .select()
        .single();

    if (error) throw error;

    await createNotificationsBulk([{
        user_id: targetUserId,
        title: 'Nova Solicitação de Troca',
        message: 'Você recebeu uma solicitação de troca de plantão.',
        type: 'SHIFT_SWAP',
        is_read: false,
        metadata: { exchange_request_id: data.id }
    }]);
    await sendPushToUsers([targetUserId], 'SHIFT_SWAP', 'Nova Solicitação de Troca', 'Você recebeu uma solicitação de troca de plantão.');

    return data as ShiftExchangeRequest;
};

export const getMyPendingExchangeRequests = async (userId: string): Promise<ShiftExchangeRequest[]> => {
    const uid = sanitizeFilterValue(userId);
    const { data, error } = await supabase
        .from('shift_exchange_requests')
        .select(`
            *,
            requesting_user:profiles!requesting_user_id(*),
            target_user:profiles!target_user_id(*),
            offered_shift:shifts!offered_shift_id(*)
        `)
        .or(`requesting_user_id.eq.${uid},target_user_id.eq.${uid}`)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });

    if (error) throw error;

    const enrichedData = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (data || []).map(async (request: any) => {
            const shiftIds = request.requested_shift_options as string[];

            if (shiftIds && shiftIds.length > 0) {
                const { data: shifts, error: shiftsError } = await supabase
                    .from('shifts')
                    .select('*')
                    .in('id', shiftIds);

                if (!shiftsError && shifts) {
                    request.requested_shifts = shifts;
                }
            }

            return request;
        })
    );

    return enrichedData as ShiftExchangeRequest[];
};

export const getAvailableShiftsForExchange = async (
    groupId: string,
    targetUserId: string,
    requestingUserId: string,
    excludeConflicts: boolean = true
): Promise<Shift[]> => {
    const today = new Date().toISOString().split('T')[0];

    const { data: assignments, error: assignError } = await supabase
        .from('shift_assignments')
        .select(`
            id,
            shift:shifts!inner(
                *,
                group:groups(name, institution)
            )
        `)
        .eq('profile_id', targetUserId)
        .gte('shift.date', today)
        .eq('shift.group_id', groupId)
        .eq('shift.is_published', true);

    if (assignError) throw assignError;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let shifts = (assignments || []).map((a: any) => ({
        ...a.shift,
        group_name: a.shift.group?.name,
        institution_name: a.shift.group?.institution
    })) as Shift[];

    if (excludeConflicts) {
        const { data: requesterAssignments, error: reqError } = await supabase
            .from('shift_assignments')
            .select(`
                shift:shifts!inner(
                    id,
                    date,
                    start_time,
                    end_time
                )
            `)
            .eq('profile_id', requestingUserId)
            .gte('shift.date', today);

        if (reqError) throw reqError;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const requesterShifts = (requesterAssignments || []).map((a: any) => a.shift);

        shifts = shifts.filter(shift => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return !requesterShifts.some((reqShift: any) => {
                if (shift.date !== reqShift.date) return false;

                const shiftStart = shift.start_time;
                const shiftEnd = shift.end_time;
                const reqStart = reqShift.start_time;
                const reqEnd = reqShift.end_time;

                return !(shiftEnd <= reqStart || shiftStart >= reqEnd);
            });
        });
    }

    return shifts;
};

export const respondToExchangeRequest = async (
    requestId: string,
    action: 'ACCEPT' | 'REJECT',
    selectedShiftId?: string
): Promise<void> => {
    const { data: request, error: fetchError } = await supabase
        .from('shift_exchange_requests')
        .select('*')
        .eq('id', requestId)
        .single();

    if (fetchError) throw fetchError;
    if (!request) throw new Error('Solicitação não encontrada.');

    if (action === 'ACCEPT') {
        if (!selectedShiftId) {
            throw new Error('Você deve selecionar um plantão para trocar.');
        }

        const options = request.requested_shift_options as string[];
        if (!options.includes(selectedShiftId)) {
            throw new Error('Plantão selecionado não está nas opções.');
        }

        await executeShiftSwap(
            request.offered_shift_id,
            selectedShiftId,
            request.requesting_user_id,
            request.target_user_id,
            requestId
        );

        const { error: updateError } = await supabase
            .from('shift_exchange_requests')
            .update({
                status: 'ACCEPTED',
                accepted_shift_id: selectedShiftId
            })
            .eq('id', requestId);

        if (updateError) throw updateError;

        await createNotificationsBulk([
            {
                user_id: request.requesting_user_id,
                title: 'Troca Aceita!',
                message: 'Sua solicitação de troca foi aceita.',
                type: 'SHIFT_SWAP',
                is_read: false
            },
            {
                user_id: request.target_user_id,
                title: 'Troca Confirmada',
                message: 'A troca de plantão foi confirmada.',
                type: 'SHIFT_SWAP',
                is_read: false
            }
        ]);
        await sendPushToUsers(
            [request.requesting_user_id, request.target_user_id],
            'SHIFT_SWAP',
            'Troca Confirmada',
            'A troca de plantão foi confirmada com sucesso.'
        );
    } else {
        const { error: updateError } = await supabase
            .from('shift_exchange_requests')
            .update({ status: 'REJECTED' })
            .eq('id', requestId);

        if (updateError) throw updateError;

        await createNotificationsBulk([{
            user_id: request.requesting_user_id,
            title: 'Troca Recusada',
            message: 'Sua solicitação de troca foi recusada.',
            type: 'SHIFT_SWAP',
            is_read: false
        }]);
        await sendPushToUsers([request.requesting_user_id], 'SHIFT_SWAP', 'Troca Recusada', 'Sua solicitação de troca foi recusada.');
    }
};

const executeShiftSwap = async (
    offeredShiftId: string,
    requestedShiftId: string,
    requestingUserId: string,
    targetUserId: string,
    exchangeRequestId?: string
): Promise<void> => {
    const { data: offeredAssignment, error: e1 } = await supabase
        .from('shift_assignments')
        .select('id')
        .eq('shift_id', offeredShiftId)
        .eq('profile_id', requestingUserId)
        .single();

    const { data: requestedAssignment, error: e2 } = await supabase
        .from('shift_assignments')
        .select('id')
        .eq('shift_id', requestedShiftId)
        .eq('profile_id', targetUserId)
        .single();

    if (e1 || e2 || !offeredAssignment || !requestedAssignment) {
        throw new Error('Erro ao localizar as atribuições de plantão.');
    }

    // Use atomic swap function with history tracking
    const { error } = await supabase.rpc('execute_shift_swap_atomic', {
        p_assignment_1_id: offeredAssignment.id,
        p_assignment_2_id: requestedAssignment.id,
        p_user_1_id: requestingUserId,
        p_user_2_id: targetUserId,
        p_exchange_id: null,
        p_exchange_request_id: exchangeRequestId || null,
        p_change_type: 'SWAP'
    });

    if (error) throw error;
};

export const getPendingActionableRequests = async (userId: string): Promise<{ swaps: ShiftExchangeRequest[], giveaways: ShiftExchange[] }> => {
    const uid = sanitizeFilterValue(userId);

    const { data: userGroups } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('profile_id', uid);

    const groupIds = userGroups?.map(g => g.group_id) || [];

    const { data: swaps, error: swapsError } = await supabase
        .from('shift_exchange_requests')
        .select(`
            *,
            requesting_user:profiles!requesting_user_id(*),
            offered_shift:shifts!offered_shift_id(
                *,
                group:groups(name, institution)
            )
        `)
        .eq('target_user_id', uid)
        .eq('status', 'PENDING');

    if (swapsError) throw swapsError;

    let giveawaysQuery = supabase
        .from('shift_exchanges')
        .select(`
            *,
            requesting_profile:profiles!requesting_profile_id(*),
            offered_shift:shift_assignments!offered_shift_assignment_id(
                id,
                shift:shifts(
                    *,
                    group:groups(name, institution)
                )
            )
        `)
        .eq('status', TradeStatus.PENDING)
        .eq('type', TradeType.GIVEAWAY)
        .neq('requesting_profile_id', uid);

    if (groupIds.length > 0) {
        giveawaysQuery = giveawaysQuery.in('group_id', groupIds);
    }

    const { data: giveaways, error: giveawaysError } = await giveawaysQuery
        .or(`target_profile_id.eq.${uid},target_profile_id.is.null`);

    if (giveawaysError) throw giveawaysError;

    const enrichedSwaps = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (swaps || []).map(async (request: any) => {
            const shiftIds = request.requested_shift_options as string[];

            if (shiftIds && shiftIds.length > 0) {
                const { data: shifts, error: shiftsError } = await supabase
                    .from('shifts')
                    .select('*')
                    .in('id', shiftIds);

                if (!shiftsError && shifts) {
                    request.requested_shifts = shifts;
                }
            }
            return request;
        })
    );

    return {
        swaps: enrichedSwaps as ShiftExchangeRequest[],
        giveaways: (giveaways || []) as ShiftExchange[]
    };
};

export const cancelExchangeRequest = async (requestId: string): Promise<void> => {
    const { data: request, error: fetchError } = await supabase
        .from('shift_exchange_requests')
        .select('target_user_id')
        .eq('id', requestId)
        .single();

    if (fetchError) throw fetchError;

    const { error } = await supabase
        .from('shift_exchange_requests')
        .update({ status: 'CANCELLED' })
        .eq('id', requestId);

    if (error) throw error;

    if (request?.target_user_id) {
        await createNotificationsBulk([{
            user_id: request.target_user_id,
            title: 'Solicitação de Troca Cancelada',
            message: 'A solicitação de troca enviada para você foi cancelada pelo remetente.',
            type: 'SHIFT_SWAP',
            is_read: false,
            metadata: { exchange_request_id: requestId }
        }]);
        await sendPushToUsers([request.target_user_id], 'SHIFT_SWAP', 'Solicitação de Troca Cancelada', 'A solicitação de troca enviada para você foi cancelada pelo remetente.');
    }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getTradeHistory = async (userId: string): Promise<any[]> => {
    const uid = sanitizeFilterValue(userId);

    const { data: swaps, error: swapsError } = await supabase
        .from('shift_exchange_requests')
        .select(`
            *,
            requesting_user:profiles!requesting_user_id(*),
            target_user:profiles!target_user_id(*),
            offered_shift:shifts!offered_shift_id(
                 *,
                 group:groups(name, institution)
            ),
            accepted_shift:shifts!accepted_shift_id(
                 *,
                 group:groups(name, institution)
            )
        `)
        .eq('status', 'ACCEPTED')
        .or(`requesting_user_id.eq.${uid},target_user_id.eq.${uid}`);

    if (swapsError) throw swapsError;

    const { data: giveaways, error: giveawaysError } = await supabase
        .from('shift_exchanges')
        .select(`
            *,
            requesting_profile:profiles!requesting_profile_id(*),
            target_profile:profiles!target_profile_id(*),
            offered_shift:shift_assignments!offered_shift_assignment_id(
                id,
                shift:shifts(
                    *,
                    group:groups(name, institution)
                )
            )
        `)
        .eq('status', TradeStatus.ACCEPTED)
        .or(`requesting_profile_id.eq.${uid},target_profile_id.eq.${uid}`);

    if (giveawaysError) throw giveawaysError;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const normalizedSwaps = (swaps || []).map((s: any) => ({
        id: s.id,
        type: 'SWAP',
        date: s.updated_at || s.created_at,
        status: s.status,
        isRequester: s.requesting_user_id === userId,
        counterparty: s.requesting_user_id === userId ? s.target_user : s.requesting_user,
        givenShift: s.requesting_user_id === userId ? s.offered_shift : s.accepted_shift,
        receivedShift: s.requesting_user_id === userId ? s.accepted_shift : s.offered_shift,
        serviceName: s.offered_shift?.group?.name
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const normalizedGiveaways = (giveaways || []).map((g: any) => {
        const isGiver = g.requesting_profile_id === userId;
        return {
            id: g.id,
            type: isGiver ? 'GIVEN' : 'TAKEN',
            date: g.updated_at || g.created_at,
            status: g.status,
            isRequester: isGiver,
            counterparty: isGiver ? g.target_profile : g.requesting_profile,
            givenShift: isGiver ? g.offered_shift?.shift : null,
            receivedShift: !isGiver ? g.offered_shift?.shift : null,
            serviceName: g.offered_shift?.shift?.group?.name
        };
    });

    const history = [...normalizedSwaps, ...normalizedGiveaways].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return history;
};
