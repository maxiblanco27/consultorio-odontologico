/**
 * @file treatmentService.js
 * @description Data access layer for clinical treatments and evolutions via Supabase.
 */

import { supabaseClient } from '../config/supabaseClient.js';
import { recalculateTreatmentBalance } from './paymentService.js';

/**
 * Fetches all active treatments for a specific patient, ordered chronologically descending.
 * @param {number|string} patientId - ID of the patient.
 * @returns {Promise<{ data: Array<Object>|null, error: Error|null }>}
 */
export async function fetchTreatmentsByPatientId(patientId) {
    try {
        const { data, error } = await supabaseClient
            .from('treatments')
            .select('*')
            .eq('patient_id', patientId)
            .eq('is_active', true)
            .order('treatment_date', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching treatments:', error);
            return { data: null, error };
        }

        // Normalize balance if null/undefined for backward compatibility
        const normalizedData = (data || []).map(item => ({
            ...item,
            balance: item.balance !== null && item.balance !== undefined ? parseFloat(item.balance) : parseFloat(item.cost || 0)
        }));

        return { data: normalizedData, error: null };
    } catch (err) {
        console.error('Unexpected error in fetchTreatmentsByPatientId:', err);
        return { data: null, error: err };
    }
}

/**
 * Inserts a new treatment record for a patient with initial balance equal to cost.
 * @param {Object} treatmentData - Treatment data containing patient_id, treatment_date, description, cost, copayment.
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function createTreatment(treatmentData) {
    try {
        const costVal = parseFloat(treatmentData.cost) || 0;
        const payload = {
            ...treatmentData,
            balance: costVal,
            is_active: true
        };

        const { data, error } = await supabaseClient
            .from('treatments')
            .insert([payload])
            .select();

        if (error) {
            console.error('Error creating treatment:', error);
            return { data: null, error };
        }

        return { data: data ? data[0] : null, error: null };
    } catch (err) {
        console.error('Unexpected error in createTreatment:', err);
        return { data: null, error: err };
    }
}

/**
 * Performs a soft-delete on a treatment by setting is_active to false.
 * @param {number|string} treatmentId - ID of the treatment to deactivate.
 * @returns {Promise<{ success: boolean, error: Error|null }>}
 */
export async function softDeleteTreatment(treatmentId) {
    try {
        const { error } = await supabaseClient
            .from('treatments')
            .update({ is_active: false })
            .eq('id', treatmentId);

        if (error) {
            console.error('Error soft-deleting treatment:', error);
            return { success: false, error };
        }

        return { success: true, error: null };
    } catch (err) {
        console.error('Unexpected error in softDeleteTreatment:', err);
        return { success: false, error: err };
    }
}

/**
 * Updates an existing treatment record in the database and synchronizes balance.
 * @param {number|string} treatmentId - ID of the treatment to update.
 * @param {Object} treatmentData - Updated treatment fields.
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function updateTreatment(treatmentId, treatmentData) {
    try {
        const { data, error } = await supabaseClient
            .from('treatments')
            .update(treatmentData)
            .eq('id', treatmentId)
            .select();

        if (error) {
            console.error('Error updating treatment:', error);
            return { data: null, error };
        }

        // If cost was updated, recalculate balance to account for previous active payments
        if (treatmentData.cost !== undefined) {
            await recalculateTreatmentBalance(treatmentId);
            
            // Re-fetch updated treatment record with new balance
            const { data: updatedRecord } = await supabaseClient
                .from('treatments')
                .select('*')
                .eq('id', treatmentId)
                .single();
                
            return { data: updatedRecord || (data ? data[0] : null), error: null };
        }

        return { data: data ? data[0] : null, error: null };
    } catch (err) {
        console.error('Unexpected error in updateTreatment:', err);
        return { data: null, error: err };
    }
}

/**
 * Fetches a Map of active treatment counts grouped by patient_id.
 * @returns {Promise<{ data: Map<number, number>|null, error: Error|null }>}
 */
export async function fetchTreatmentCounts() {
    try {
        const { data, error } = await supabaseClient
            .from('treatments')
            .select('patient_id')
            .eq('is_active', true);

        if (error) {
            console.error('Error fetching treatment counts:', error);
            return { data: null, error };
        }

        const countMap = new Map();
        (data || []).forEach(item => {
            const pid = Number(item.patient_id);
            const current = countMap.get(pid) || 0;
            countMap.set(pid, current + 1);
        });

        return { data: countMap, error: null };
    } catch (err) {
        console.error('Unexpected error in fetchTreatmentCounts:', err);
        return { data: null, error: err };
    }
}


