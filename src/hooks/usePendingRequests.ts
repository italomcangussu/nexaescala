import { useState, useEffect, useCallback } from 'react';
import { ShiftExchange, ShiftExchangeRequest, Profile } from '../types';
import { getPendingActionableRequests, respondToShiftExchange, respondToExchangeRequest } from '../services/api';
import { useToast } from '../context/ToastContext';

export const usePendingRequests = (currentUser: Profile | null) => {
    const { showToast } = useToast();
    const [pendingSwaps, setPendingSwaps] = useState<ShiftExchangeRequest[]>([]);
    const [pendingGiveaways, setPendingGiveaways] = useState<ShiftExchange[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

    const fetchPending = useCallback(async () => {
        if (!currentUser) return;
        setIsLoading(true);
        try {
            const data = await getPendingActionableRequests(currentUser.id);
            setPendingSwaps(data.swaps);
            setPendingGiveaways(data.giveaways);
        } catch (error) {
            console.error("Error fetching pending requests:", error);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchPending();
    }, [fetchPending]);

    const handleAccept = async (item: ShiftExchange | ShiftExchangeRequest) => {
        if (!currentUser) return;

        setIsActionLoading(item.id);
        try {
            if ('requested_shift_options' in item) {
                // It's a ShiftExchangeRequest (Swap)
                // Swaps still require selecting a shift, so we might need a modal or a simplified logic.
                // For now, if there's only one option, we could auto-accept, 
                // but the requirements say "choose if accept or refuse".
                // If the user wants a simplified Accept from dashboard, 
                // we might need to open the ExchangeResponseModal.
                showToast('Por favor, escolha um plantão para completar a troca.', 'info');
                // We'll return a special status to signal MainApp to open the modal
                return { type: 'OPEN_MODAL', item };
            } else {
                // It's a ShiftExchange (Giveaway)
                await respondToShiftExchange(item.id, 'ACCEPT', currentUser.id);
                showToast('Repasse aceito com sucesso!', 'success');
                fetchPending();
            }
        } catch (error: any) {
            showToast(error.message || 'Erro ao processar ação', 'error');
        } finally {
            setIsActionLoading(null);
        }
    };

    const handleDecline = async (item: ShiftExchange | ShiftExchangeRequest) => {
        if (!currentUser) return;

        setIsActionLoading(item.id);
        try {
            if ('requested_shift_options' in item) {
                await respondToExchangeRequest(item.id, 'REJECT');
                showToast('Solicitação recusada', 'info');
            } else {
                await respondToShiftExchange(item.id, 'REJECT', currentUser.id);
                showToast('Repasse recusado', 'info');
            }
            fetchPending();
        } catch (error: any) {
            showToast(error.message || 'Erro ao recusar', 'error');
        } finally {
            setIsActionLoading(null);
        }
    };

    return {
        pendingSwaps,
        pendingGiveaways,
        isLoading,
        isActionLoading,
        handleAccept,
        handleDecline,
        refresh: fetchPending
    };
};
