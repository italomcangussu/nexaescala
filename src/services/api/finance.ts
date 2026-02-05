import { supabase } from '../../lib/supabase';
import { FinancialRecord, FinancialConfig } from '../../types';
import { fetchWithCache, invalidateCacheExact } from './cache';

// --- FINANCIAL RECORDS ---

export interface FinancialRecordWithGroup extends FinancialRecord {
    group_name: string;
    date: string;
}

export const getFinancialRecords = async (userId: string): Promise<FinancialRecordWithGroup[]> => {
    const { data, error } = await supabase
        .from('financial_records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((record: any) => ({
        id: record.id,
        shift_id: record.shift_id,
        fixed_earnings: Number(record.fixed_earnings) || 0,
        production_quantity: record.production_quantity || 0,
        production_earnings: Number(record.production_earnings) || 0,
        extras_value: Number(record.extras_value) || 0,
        extras_description: record.extras_description,
        gross_total: Number(record.gross_total) || 0,
        net_total: Number(record.net_total) || 0,
        is_paid: record.is_paid || false,
        paid_at: record.paid_at,
        group_name: 'Plantão',
        date: record.created_at
    }));
};

export const updateFinancialRecordPaidStatus = async (recordId: string, isPaid: boolean): Promise<void> => {
    const { error } = await supabase
        .from('financial_records')
        .update({
            is_paid: isPaid,
            paid_at: isPaid ? new Date().toISOString() : null
        })
        .eq('id', recordId);

    if (error) throw error;
};

export const createFinancialRecord = async (record: Omit<FinancialRecord, 'id'>): Promise<FinancialRecord> => {
    const { data, error } = await supabase
        .from('financial_records')
        .insert(record)
        .select()
        .single();

    if (error) throw error;
    return data as FinancialRecord;
};

// --- FINANCIAL CONFIG ---

export const getFinancialConfig = async (userId: string, groupId: string): Promise<FinancialConfig | null> => {
    return fetchWithCache(`fin_config_${userId}_${groupId}`, async () => {
        const { data, error } = await supabase
            .from('financial_configs')
            .select('*')
            .eq('user_id', userId)
            .eq('group_id', groupId)
            .maybeSingle();

        if (error) return null;
        return data as FinancialConfig;
    });
};

export const saveFinancialConfig = async (userId: string, config: FinancialConfig): Promise<void> => {
    const { error } = await supabase
        .from('financial_configs')
        .upsert({
            user_id: userId,
            group_id: config.group_id,
            contract_type: config.contract_type,
            payment_model: config.payment_model,
            fixed_value: config.fixed_value,
            production_value_unit: config.production_value_unit,
            tax_percent: config.tax_percent,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,group_id' });

    if (error) throw error;
    invalidateCacheExact(`fin_config_${userId}_${config.group_id}`);
};
