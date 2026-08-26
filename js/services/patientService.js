/**
 * @file patientService.js
 * @description Data access layer for patient entity operations via Supabase.
 */

import { supabaseClient } from '../config/supabaseClient.js';

/**
 * Fetches all active patients ordered by ID descending.
 * @returns {Promise<{ data: Array<Object>|null, error: Error|null }>}
 */
export async function fetchActivePatients() {
    try {
        // Fetch active or legacy (is_active IS NULL) patients
        let { data, error } = await supabaseClient
            .from('patients')
            .select('*')
            .or('is_active.eq.true,is_active.is.null')
            .order('id', { ascending: false });

        // Fallback: if 'is_active' column does not exist in staging/test database schema
        if (error && (error.code === 'PGRST204' || error.message?.includes('is_active'))) {
            console.warn('is_active column not found in patients table. Falling back to select * without filter.');
            const fallbackResult = await supabaseClient
                .from('patients')
                .select('*')
                .order('id', { ascending: false });
            data = fallbackResult.data;
            error = fallbackResult.error;
        }

        if (error) {
            console.error('Error fetching patients:', error);
            return { data: null, error };
        }

        return { data: data || [], error: null };
    } catch (err) {
        console.error('Unexpected error in fetchActivePatients:', err);
        return { data: null, error: err };
    }
}

/**
 * Inserts a new patient record into the database.
 * @param {Object} patientData - The patient data object to insert.
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function createPatient(patientData) {
    try {
        const payload = {
            ...patientData,
            is_active: true
        };

        let { data, error } = await supabaseClient
            .from('patients')
            .insert([payload])
            .select();

        // Fallback: if is_active column does not exist in DB schema
        if (error && (error.code === 'PGRST204' || error.message?.includes('is_active'))) {
            console.warn('is_active column not found. Inserting without is_active.');
            const fallbackResult = await supabaseClient
                .from('patients')
                .insert([patientData])
                .select();
            data = fallbackResult.data;
            error = fallbackResult.error;
        }

        if (error) {
            console.error('Error creating patient:', error);
            return { data: null, error };
        }

        return { data: data ? data[0] : null, error: null };
    } catch (err) {
        console.error('Unexpected error in createPatient:', err);
        return { data: null, error: err };
    }
}

/**
 * Updates an existing patient record in the database.
 * @param {number|string} patientId - ID of the patient to update.
 * @param {Object} patientData - The updated fields for the patient.
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function updatePatient(patientId, patientData) {
    try {
        const { data, error } = await supabaseClient
            .from('patients')
            .update(patientData)
            .eq('id', patientId)
            .select();

        if (error) {
            console.error('Error updating patient:', error);
            return { data: null, error };
        }

        return { data: data ? data[0] : null, error: null };
    } catch (err) {
        console.error('Unexpected error in updatePatient:', err);
        return { data: null, error: err };
    }
}

/**
 * Performs a soft-delete on a patient by updating is_active to false.
 * @param {number|string} patientId - ID of the patient to deactivate.
 * @returns {Promise<{ success: boolean, error: Error|null }>}
 */
export async function softDeletePatient(patientId) {
    try {
        const { error } = await supabaseClient
            .from('patients')
            .update({ is_active: false })
            .eq('id', patientId);

        if (error) {
            console.error('Error soft-deleting patient:', error);
            return { success: false, error };
        }

        return { success: true, error: null };
    } catch (err) {
        console.error('Unexpected error in softDeletePatient:', err);
        return { success: false, error: err };
    }
}
