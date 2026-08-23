/**
 * @file treatmentModal.js
 * @description UI component for managing the clinical history modal, quick-add treatment form, and evolutions list.
 */

import { formatCurrency, formatDate, getTodayDateString } from '../utils/formatters.js';
import { showModalAlert } from './alertBanner.js';

let currentPatient = null;
let onAddTreatmentCallback = null;
let onDeleteTreatmentCallback = null;

/**
 * Initializes the treatment modal event listeners.
 * @param {Object} options - Action callbacks.
 * @param {Function} options.onAddTreatment - Invoked with { patientId, treatmentData }.
 * @param {Function} options.onDeleteTreatment - Invoked with { treatmentId, patientId }.
 */
export function initTreatmentModal({ onAddTreatment, onDeleteTreatment }) {
    onAddTreatmentCallback = onAddTreatment;
    onDeleteTreatmentCallback = onDeleteTreatment;

    const modalOverlay = document.getElementById('historyModal');
    const newTreatmentForm = document.getElementById('newTreatmentForm');
    const closeBtn = document.getElementById('closeModalBtn');
    const closeFooterBtn = document.getElementById('closeModalFooterBtn');

    // Close on backdrop click
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeTreatmentModal();
            }
        });
    }

    // Close buttons
    closeBtn?.addEventListener('click', closeTreatmentModal);
    closeFooterBtn?.addEventListener('click', closeTreatmentModal);

    // Escape key listener
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && currentPatient) {
            closeTreatmentModal();
        }
    });

    // New Treatment Form submission
    if (newTreatmentForm) {
        newTreatmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!currentPatient) {
                showModalAlert('Error: No se ha seleccionado un paciente válido.');
                return;
            }

            const treatmentDateInput = document.getElementById('treatmentDate');
            const treatmentCostInput = document.getElementById('treatmentCost');
            const treatmentCopaymentInput = document.getElementById('treatmentCopayment');
            const treatmentDescInput = document.getElementById('treatmentDescription');
            const saveBtn = document.getElementById('saveTreatmentBtn');

            const treatmentDate = treatmentDateInput.value.trim();
            const costVal = parseFloat(treatmentCostInput.value);
            const rawCopayment = treatmentCopaymentInput ? treatmentCopaymentInput.value.trim() : '';
            const copaymentVal = rawCopayment !== '' ? parseFloat(rawCopayment) : 0;
            const description = treatmentDescInput.value.trim();

            // Field Validations
            if (!treatmentDate) {
                showModalAlert('La fecha del tratamiento no puede estar vacía.');
                return;
            }

            if (isNaN(costVal) || costVal < 0) {
                showModalAlert('El costo debe ser un valor numérico mayor o igual a 0.');
                return;
            }

            if (isNaN(copaymentVal) || copaymentVal < 0) {
                showModalAlert('El coseguro debe ser un valor numérico mayor o igual a 0.');
                return;
            }

            if (!description) {
                showModalAlert('Debe ingresar una descripción para el tratamiento.');
                return;
            }

            const treatmentData = {
                patient_id: currentPatient.id,
                treatment_date: treatmentDate,
                cost: costVal,
                copayment: copaymentVal,
                description: description
            };

            try {
                if (saveBtn) {
                    saveBtn.disabled = true;
                    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
                }

                if (onAddTreatmentCallback) {
                    const success = await onAddTreatmentCallback(treatmentData);
                    if (success) {
                        treatmentDescInput.value = '';
                        treatmentCostInput.value = '';
                        treatmentCostInput.placeholder = '0.00';
                        if (treatmentCopaymentInput) {
                            treatmentCopaymentInput.value = '';
                            treatmentCopaymentInput.placeholder = '0.00';
                        }
                        treatmentDateInput.value = getTodayDateString();
                    }
                }
            } finally {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Tratamiento';
                }
            }
        });
    }
}

/**
 * Opens the treatment history modal for a patient.
 * @param {Object} patient - The patient data object.
 */
export function openTreatmentModal(patient) {
    currentPatient = patient;

    const modalPatientName = document.getElementById('modalPatientName');
    const modalPatientInfo = document.getElementById('modalPatientInfo');
    const treatmentDateInput = document.getElementById('treatmentDate');
    const treatmentCostInput = document.getElementById('treatmentCost');
    const treatmentCopaymentInput = document.getElementById('treatmentCopayment');
    const treatmentDescInput = document.getElementById('treatmentDescription');
    const modalAlert = document.getElementById('modalAlertMessage');
    const modalOverlay = document.getElementById('historyModal');

    if (modalPatientName) {
        modalPatientName.textContent = `Historial Clínico: ${patient.full_name}`;
    }

    if (modalPatientInfo) {
        modalPatientInfo.textContent = `DNI: ${patient.dni || '-'} | Obra Social: ${patient.health_insurance || 'Particular'}`;
    }

    // Default date to today
    if (treatmentDateInput) {
        treatmentDateInput.value = getTodayDateString();
    }

    // Reset inputs
    if (treatmentCostInput) treatmentCostInput.value = '';
    if (treatmentCopaymentInput) {
        treatmentCopaymentInput.value = '';
        treatmentCopaymentInput.placeholder = '0.00';
    }
    if (treatmentDescInput) treatmentDescInput.value = '';
    if (modalAlert) modalAlert.style.display = 'none';

    // Show modal
    if (modalOverlay) {
        modalOverlay.style.display = 'flex';
    }
}

/**
 * Closes the treatment history modal.
 */
export function closeTreatmentModal() {
    currentPatient = null;
    const modalOverlay = document.getElementById('historyModal');
    if (modalOverlay) {
        modalOverlay.style.display = 'none';
    }
}

/**
 * Returns the currently viewing patient in the modal, if open.
 * @returns {Object|null}
 */
export function getCurrentModalPatient() {
    return currentPatient;
}

/**
 * Sets the loading state inside the treatments list.
 * @param {boolean} isLoading - Loading indicator.
 */
export function setTreatmentsLoading(isLoading) {
    const loadingElem = document.getElementById('treatmentsLoading');
    const emptyElem = document.getElementById('treatmentsEmpty');
    const tableElem = document.getElementById('treatmentsTable');

    if (isLoading) {
        if (loadingElem) loadingElem.style.display = 'block';
        if (emptyElem) emptyElem.style.display = 'none';
        if (tableElem) tableElem.style.display = 'none';
    } else {
        if (loadingElem) loadingElem.style.display = 'none';
    }
}

/**
 * Renders the list of treatments and updates the total cost badge.
 * @param {Array<Object>} treatments - Array of treatment objects.
 */
export function renderTreatments(treatments) {
    const emptyElem = document.getElementById('treatmentsEmpty');
    const tableElem = document.getElementById('treatmentsTable');
    const listElem = document.getElementById('treatmentsList');
    const totalBadgeElem = document.getElementById('totalCostBadge');

    if (!listElem) return;

    listElem.innerHTML = '';

    if (!treatments || treatments.length === 0) {
        if (emptyElem) emptyElem.style.display = 'block';
        if (tableElem) tableElem.style.display = 'none';
        if (totalBadgeElem) {
            totalBadgeElem.innerHTML = 'Total Acumulado: <strong>$0.00</strong>';
        }
        return;
    }

    let totalCost = 0;

    treatments.forEach(treatment => {
        const cost = parseFloat(treatment.cost) || 0;
        totalCost += cost;

        const row = document.createElement('tr');
        row.setAttribute('data-treatment-id', treatment.id);

        row.innerHTML = `
            <td><strong>${formatDate(treatment.treatment_date)}</strong></td>
            <td>${escapeHtml(treatment.description || '')}</td>
            <td><strong>${formatCurrency(treatment.cost)}</strong></td>
            <td><strong>${formatCurrency(treatment.copayment || 0)}</strong></td>
            <td class="text-center">
                <button type="button" class="btn-eliminar-tratamiento" data-id="${treatment.id}" title="Eliminar este tratamiento">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;

        row.querySelector('.btn-eliminar-tratamiento')?.addEventListener('click', () => {
            if (onDeleteTreatmentCallback && currentPatient) {
                onDeleteTreatmentCallback(treatment.id, currentPatient.id);
            }
        });

        listElem.appendChild(row);
    });

    if (totalBadgeElem) {
        totalBadgeElem.innerHTML = `Total Acumulado: <strong>${formatCurrency(totalCost)}</strong>`;
    }

    if (emptyElem) emptyElem.style.display = 'none';
    if (tableElem) tableElem.style.display = 'table';
}

/**
 * Helper to escape HTML characters.
 * @param {string} str - Raw string.
 * @returns {string}
 */
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
