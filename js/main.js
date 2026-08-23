/**
 * @file main.js
 * @description Main entry point for the dental clinic application.
 * Orchestrates event listeners, services, and UI components on DOMContentLoaded.
 */

import { fetchActivePatients, createPatient, updatePatient, softDeletePatient } from './services/patientService.js';
import { fetchTreatmentsByPatientId, createTreatment, softDeleteTreatment } from './services/treatmentService.js';
import { showAlert, showModalAlert, initEnvironmentBanner } from './ui/alertBanner.js';
import { initPatientTable, renderPatientsTable, appendPatientRow, removePatientRow, getCachedPatient } from './ui/patientTable.js';
import { initPatientForm, loadPatientIntoForm, resetPatientForm, setFormLoading, getCurrentlyEditingId } from './ui/patientForm.js';
import { initTreatmentModal, openTreatmentModal, closeTreatmentModal, renderTreatments, setTreatmentsLoading, getCurrentModalPatient } from './ui/treatmentModal.js';
import { initVersionManager } from './version/versionManager.js';

/**
 * Loads all active patients from the database and updates the table.
 */
async function loadPatients() {
    const { data: patients, error } = await fetchActivePatients();

    if (error) {
        showAlert(`No se pudo conectar a la base de datos: ${error.message || 'Verifique su conexión.'}`);
        return;
    }

    renderPatientsTable(patients || []);
}

/**
 * Loads and renders treatments for a given patient.
 * @param {number|string} patientId - Patient ID.
 */
async function loadPatientTreatments(patientId) {
    setTreatmentsLoading(true);
    const { data: treatments, error } = await fetchTreatmentsByPatientId(patientId);
    setTreatmentsLoading(false);

    if (error) {
        showModalAlert(`Error al consultar los tratamientos: ${error.message}`);
        return;
    }

    renderTreatments(treatments || []);
}

/**
 * Handles patient form submission (both Create and Update).
 * @param {Object} payload - { isEdit, patientId, formData }
 */
async function handlePatientSubmit({ isEdit, patientId, formData }) {
    setFormLoading(true);

    try {
        if (isEdit) {
            const { data, error } = await updatePatient(patientId, formData);
            if (error) {
                showAlert(`Error al actualizar el paciente: ${error.message}`);
            } else {
                showAlert('Paciente actualizado exitosamente.', false);
                resetPatientForm();
                await loadPatients();
            }
        } else {
            const { data, error } = await createPatient(formData);
            if (error) {
                showAlert(`Error al guardar el paciente: ${error.message}`);
            } else {
                if (data) {
                    appendPatientRow(data);
                }
                resetPatientForm();
                showAlert('Paciente guardado exitosamente.', false);
            }
        }
    } finally {
        setFormLoading(false);
    }
}

/**
 * Handles patient deletion.
 * @param {number|string} patientId - ID of patient to delete.
 */
async function handlePatientDelete(patientId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este paciente?')) {
        return;
    }

    const { success, error } = await softDeletePatient(patientId);

    if (!success || error) {
        showAlert(`No se pudo eliminar el registro: ${error ? error.message : 'Error desconocido'}`);
        return;
    }

    removePatientRow(patientId);

    // If deleting patient currently being edited, reset form
    if (getCurrentlyEditingId() === patientId) {
        resetPatientForm();
    }

    // If deleting patient whose history modal is open, close modal
    const modalPatient = getCurrentModalPatient();
    if (modalPatient && modalPatient.id === patientId) {
        closeTreatmentModal();
    }

    showAlert('Registro eliminado correctamente.', false);
}

/**
 * Handles opening the clinical history modal for a patient.
 * @param {Object} patient - Patient data object.
 */
async function handleOpenHistory(patient) {
    openTreatmentModal(patient);
    await loadPatientTreatments(patient.id);
}

/**
 * Handles adding a new treatment for the active patient.
 * @param {Object} treatmentData - New treatment data.
 * @returns {Promise<boolean>} True if successful.
 */
async function handleAddTreatment(treatmentData) {
    const { data, error } = await createTreatment(treatmentData);

    if (error) {
        showModalAlert(`Error al guardar el tratamiento: ${error.message}`);
        return false;
    }

    showModalAlert('Tratamiento registrado exitosamente.', false);
    await loadPatientTreatments(treatmentData.patient_id);
    return true;
}

/**
 * Handles soft-deleting a treatment from a patient's history.
 * @param {number|string} treatmentId - Treatment ID.
 * @param {number|string} patientId - Associated Patient ID.
 */
async function handleDeleteTreatment(treatmentId, patientId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este tratamiento del historial?')) {
        return;
    }

    const { success, error } = await softDeleteTreatment(treatmentId);

    if (!success || error) {
        showModalAlert(`No se pudo eliminar el tratamiento: ${error ? error.message : 'Error desconocido'}`);
        return;
    }

    showModalAlert('Tratamiento eliminado correctamente.', false);
    await loadPatientTreatments(patientId);
}

/**
 * Initialize all modules when the DOM is ready.
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize environment warning banner
    initEnvironmentBanner();

    // 2. Initialize version display and update checker
    initVersionManager();

    // 3. Initialize patient form component
    initPatientForm({
        onSubmit: handlePatientSubmit
    });

    // 4. Initialize patient table component
    initPatientTable({
        onEditPatient: (patient) => loadPatientIntoForm(patient),
        onDeletePatient: handlePatientDelete,
        onOpenHistory: handleOpenHistory
    });

    // 5. Initialize clinical history modal component
    initTreatmentModal({
        onAddTreatment: handleAddTreatment,
        onDeleteTreatment: handleDeleteTreatment
    });

    // 6. Initial data fetch
    loadPatients();
});
