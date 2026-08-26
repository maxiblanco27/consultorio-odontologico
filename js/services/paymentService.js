/**
 * @file paymentService.js
 * @description Data access layer for economic contributions/payments per treatment via Supabase.
 */

import { supabaseClient } from '../config/supabaseClient.js';

/**
 * Fetches all active payments for a specific treatment, ordered by payment_date descending.
 * @param {number|string} treatmentId - ID of the treatment.
 * @returns {Promise<{ data: Array<Object>|null, error: Error|null }>}
 */
export async function fetchPaymentsByTreatmentId(treatmentId) {
    try {
        const { data, error } = await supabaseClient
            .from('treatment_payments')
            .select('*')
            .eq('treatment_id', treatmentId)
            .eq('is_active', true)
            .order('payment_date', { ascending: false })
            .order('id', { ascending: false });

        if (error) {
            console.error('Error fetching treatment payments:', error);
            return { data: null, error };
        }

        return { data: data || [], error: null };
    } catch (err) {
        console.error('Unexpected error in fetchPaymentsByTreatmentId:', err);
        return { data: null, error: err };
    }
}

/**
 * Recalculates and updates the balance of a treatment in the database based on active payments.
 * Balance = cost - sum(active payments).
 * @param {number|string} treatmentId - ID of the treatment.
 * @returns {Promise<{ totalPaid: number, balance: number, error: Error|null }>}
 */
export async function recalculateTreatmentBalance(treatmentId) {
    try {
        // 1. Fetch current treatment cost
        const { data: treatment, error: treatmentError } = await supabaseClient
            .from('treatments')
            .select('id, cost')
            .eq('id', treatmentId)
            .single();

        if (treatmentError) {
            console.error('Error fetching treatment for balance recalculation:', treatmentError);
            return { totalPaid: 0, balance: 0, error: treatmentError };
        }

        const cost = parseFloat(treatment?.cost) || 0;

        // 2. Fetch all active payments
        const { data: payments, error: paymentsError } = await supabaseClient
            .from('treatment_payments')
            .select('amount')
            .eq('treatment_id', treatmentId)
            .eq('is_active', true);

        if (paymentsError) {
            console.error('Error fetching payments for balance calculation:', paymentsError);
            return { totalPaid: 0, balance: cost, error: paymentsError };
        }

        const totalPaid = (payments || []).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const newBalance = Math.round((cost - totalPaid) * 100) / 100;

        // 3. Update treatment balance in database
        const { error: updateError } = await supabaseClient
            .from('treatments')
            .update({ balance: newBalance })
            .eq('id', treatmentId);

        if (updateError) {
            console.error('Error updating treatment balance:', updateError);
            return { totalPaid, balance: newBalance, error: updateError };
        }

        return { totalPaid, balance: newBalance, error: null };
    } catch (err) {
        console.error('Unexpected error in recalculateTreatmentBalance:', err);
        return { totalPaid: 0, balance: 0, error: err };
    }
}

/**
 * Creates a new payment record for a treatment and updates the treatment balance.
 * @param {Object} paymentData - Payment data containing treatment_id, payment_date, amount, notes.
 * @returns {Promise<{ data: Object|null, balanceInfo: Object|null, error: Error|null }>}
 */
export async function createPayment(paymentData) {
    try {
        const payload = {
            treatment_id: paymentData.treatment_id,
            payment_date: paymentData.payment_date,
            amount: parseFloat(paymentData.amount) || 0,
            notes: paymentData.notes ? paymentData.notes.trim() : null,
            is_active: true
        };

        const { data, error } = await supabaseClient
            .from('treatment_payments')
            .insert([payload])
            .select();

        if (error) {
            console.error('Error creating treatment payment:', error);
            return { data: null, balanceInfo: null, error };
        }

        const createdPayment = data ? data[0] : null;

        // Recalculate treatment balance automatically
        const balanceInfo = await recalculateTreatmentBalance(paymentData.treatment_id);

        return { data: createdPayment, balanceInfo, error: null };
    } catch (err) {
        console.error('Unexpected error in createPayment:', err);
        return { data: null, balanceInfo: null, error: err };
    }
}

/**
 * Performs a soft-delete on a payment by setting is_active to false and recalculates treatment balance.
 * @param {number|string} paymentId - ID of the payment to deactivate.
 * @param {number|string} treatmentId - ID of the parent treatment.
 * @returns {Promise<{ success: boolean, balanceInfo: Object|null, error: Error|null }>}
 */
export async function softDeletePayment(paymentId, treatmentId) {
    try {
        const { error } = await supabaseClient
            .from('treatment_payments')
            .update({ is_active: false })
            .eq('id', paymentId);

        if (error) {
            console.error('Error soft-deleting payment:', error);
            return { success: false, balanceInfo: null, error };
        }

        // Recalculate treatment balance automatically
        const balanceInfo = await recalculateTreatmentBalance(treatmentId);

        return { success: true, balanceInfo, error: null };
    } catch (err) {
        console.error('Unexpected error in softDeletePayment:', err);
        return { success: false, balanceInfo: null, error: err };
    }
}
