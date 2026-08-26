/**
 * @file treatmentModal.js
 * @description UI component for managing the clinical history modal, quick-add/edit treatment form, and evolutions list.
 */

import { formatCurrency, formatDate, getTodayDateString } from '../utils/formatters.js';
import { showModalAlert } from './alertBanner.js';

let currentPatient = null;
let currentEditingTreatmentId = null;
let onAddTreatmentCallback = null;
let onUpdateTreatmentCallback = null;
let onDeleteTreatmentCallback = null;
let onOpenPaymentsCallback = null;

/**
 * Initializes the treatment modal event listeners.
 * @param {Object} options - Action callbacks.
 * @param {Function} options.onAddTreatment - Invoked with treatmentData.
 * @param {Function} options.onUpdateTreatment - Invoked with (treatmentId, treatmentData).
 * @param {Function} options.onDeleteTreatment - Invoked with (treatmentId, patientId).
 * @param {Function} options.onOpenPayments - Invoked with (treatment, patient).
 */
export function initTreatmentModal({ onAddTreatment, onUpdateTreatment, onDeleteTreatment, onOpenPayments }) {
    onAddTreatmentCallback = onAddTreatment;
    onUpdateTreatmentCallback = onUpdateTreatment;
    onDeleteTreatmentCallback = onDeleteTreatment;
    onOpenPaymentsCallback = onOpenPayments;

    const modalOverlay = document.getElementById('historyModal');
    const newTreatmentForm = document.getElementById('newTreatmentForm');
    const closeBtn = document.getElementById('closeModalBtn');
    const closeFooterBtn = document.getElementById('closeModalFooterBtn');
    const cancelEditBtn = document.getElementById('cancelTreatmentEditBtn');

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

    // Cancel edit button
    cancelEditBtn?.addEventListener('click', resetTreatmentForm);

    // Escape key listener
    document.addEventListener('keydown', (e) => {
        const historyModal = document.getElementById('historyModal');
        const paymentModal = document.getElementById('paymentModal');
        if (paymentModal && paymentModal.style.display === 'flex') return;
        if (e.key === 'Escape' && currentPatient && historyModal?.style.display === 'flex') {
            closeTreatmentModal();
        }
    });

    // New/Edit Treatment Form submission
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

            const isEdit = Boolean(currentEditingTreatmentId);

            try {
                if (saveBtn) {
                    saveBtn.disabled = true;
                    saveBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${isEdit ? 'Actualizando...' : 'Guardando...'}`;
                }

                if (isEdit && onUpdateTreatmentCallback) {
                    const success = await onUpdateTreatmentCallback(currentEditingTreatmentId, treatmentData);
                    if (success) {
                        resetTreatmentForm();
                    }
                } else if (onAddTreatmentCallback) {
                    const success = await onAddTreatmentCallback(treatmentData);
                    if (success) {
                        resetTreatmentForm();
                    }
                }
            } finally {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    if (currentEditingTreatmentId) {
                        saveBtn.innerHTML = '<i class="fas fa-edit"></i> Actualizar Tratamiento';
                        saveBtn.classList.add('btn-actualizar-mode');
                    } else {
                        saveBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Tratamiento';
                        saveBtn.classList.remove('btn-actualizar-mode');
                    }
                }
            }
        });
    }
}

/**
 * Loads a treatment record into the form inputs for editing.
 * @param {Object} treatment - Treatment data object.
 */
export function loadTreatmentIntoForm(treatment) {
    if (!treatment) return;

    currentEditingTreatmentId = treatment.id;

    const treatmentDateInput = document.getElementById('treatmentDate');
    const treatmentCostInput = document.getElementById('treatmentCost');
    const treatmentCopaymentInput = document.getElementById('treatmentCopayment');
    const treatmentDescInput = document.getElementById('treatmentDescription');
    const formTitle = document.getElementById('treatmentFormTitle');
    const saveBtn = document.getElementById('saveTreatmentBtn');
    const cancelEditBtn = document.getElementById('cancelTreatmentEditBtn');

    if (treatmentDateInput) treatmentDateInput.value = treatment.treatment_date || getTodayDateString();
    if (treatmentCostInput) treatmentCostInput.value = treatment.cost !== undefined && treatment.cost !== null ? treatment.cost : '';
    if (treatmentCopaymentInput) treatmentCopaymentInput.value = treatment.copayment !== undefined && treatment.copayment !== null ? treatment.copayment : '';
    if (treatmentDescInput) treatmentDescInput.value = treatment.description || '';

    if (formTitle) {
        formTitle.innerHTML = '<i class="fas fa-pencil-alt"></i> Editar Tratamiento';
    }

    if (saveBtn) {
        saveBtn.innerHTML = '<i class="fas fa-edit"></i> Actualizar Tratamiento';
        saveBtn.classList.add('btn-actualizar-mode');
    }

    if (cancelEditBtn) {
        cancelEditBtn.style.display = 'inline-flex';
    }

    // Scroll to the form
    document.querySelector('.treatment-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Resets the treatment form back to Create Mode.
 */
export function resetTreatmentForm() {
    currentEditingTreatmentId = null;

    const treatmentDateInput = document.getElementById('treatmentDate');
    const treatmentCostInput = document.getElementById('treatmentCost');
    const treatmentCopaymentInput = document.getElementById('treatmentCopayment');
    const treatmentDescInput = document.getElementById('treatmentDescription');
    const formTitle = document.getElementById('treatmentFormTitle');
    const saveBtn = document.getElementById('saveTreatmentBtn');
    const cancelEditBtn = document.getElementById('cancelTreatmentEditBtn');

    if (treatmentDateInput) treatmentDateInput.value = getTodayDateString();
    if (treatmentCostInput) {
        treatmentCostInput.value = '';
        treatmentCostInput.placeholder = '0.00';
    }
    if (treatmentCopaymentInput) {
        treatmentCopaymentInput.value = '';
        treatmentCopaymentInput.placeholder = '0.00';
    }
    if (treatmentDescInput) treatmentDescInput.value = '';

    if (formTitle) {
        formTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Registrar Nuevo Tratamiento';
    }

    if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Tratamiento';
        saveBtn.classList.remove('btn-actualizar-mode');
    }

    if (cancelEditBtn) {
        cancelEditBtn.style.display = 'none';
    }
}

/**
 * Opens the treatment history modal for a patient.
 * @param {Object} patient - The patient data object.
 */
export function openTreatmentModal(patient) {
    currentPatient = patient;
    resetTreatmentForm();

    const modalPatientName = document.getElementById('modalPatientName');
    const modalPatientInfo = document.getElementById('modalPatientInfo');
    const modalAlert = document.getElementById('modalAlertMessage');
    const modalOverlay = document.getElementById('historyModal');

    if (modalPatientName) {
        modalPatientName.textContent = `Historial Clínico: ${patient.full_name}`;
    }

    if (modalPatientInfo) {
        modalPatientInfo.textContent = `DNI: ${patient.dni || '-'} | Obra Social: ${patient.health_insurance || 'Particular'}`;
    }

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
    resetTreatmentForm();
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
 * Renders the list of treatments and updates the financial badges and summaries.
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
            totalBadgeElem.innerHTML = `
                <div class="patient-financial-summary">
                    <span>Costo: <strong>$ 0,00</strong></span>
                    <span class="summary-sep">|</span>
                    <span class="text-success">Abonado: <strong>$ 0,00</strong></span>
                    <span class="summary-sep">|</span>
                    <span>Saldo: <strong>$ 0,00</strong></span>
                </div>
            `;
        }
        return;
    }

    let totalCost = 0;
    let totalPaid = 0;
    let totalBalance = 0;

    treatments.forEach(treatment => {
        const cost = parseFloat(treatment.cost) || 0;
        const balance = treatment.balance !== undefined && treatment.balance !== null
            ? parseFloat(treatment.balance)
            : cost;
        const paid = Math.max(0, cost - balance);

        totalCost += cost;
        totalPaid += paid;
        totalBalance += balance;

        const row = document.createElement('tr');
        row.setAttribute('data-treatment-id', treatment.id);

        const isFullyPaid = balance <= 0;
        const balanceBadgeHtml = isFullyPaid
            ? `<span class="badge-status badge-paid"><i class="fas fa-check-circle"></i> Saldado</span>`
            : `<span class="badge-status badge-pending"><i class="fas fa-clock"></i> ${formatCurrency(balance)}</span>`;

        row.innerHTML = `
            <td><strong>${formatDate(treatment.treatment_date)}</strong></td>
            <td>${escapeHtml(treatment.description || '')}</td>
            <td><strong>${formatCurrency(treatment.cost)}</strong></td>
            <td>${formatCurrency(treatment.copayment || 0)}</td>
            <td><strong class="text-success">${formatCurrency(paid)}</strong></td>
            <td>${balanceBadgeHtml}</td>
            <td class="text-center action-buttons-cell">
                <button type="button" class="btn-pagos-tratamiento" data-id="${treatment.id}" title="Registrar / Ver aportes económicos">
                    <i class="fas fa-hand-holding-usd"></i> Aportes
                </button>
                <button type="button" class="btn-editar-tratamiento" data-id="${treatment.id}" title="Editar este tratamiento">
                    <i class="fas fa-pencil-alt"></i>
                </button>
                <button type="button" class="btn-eliminar-tratamiento" data-id="${treatment.id}" title="Eliminar este tratamiento">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;

        row.querySelector('.btn-pagos-tratamiento')?.addEventListener('click', () => {
            if (onOpenPaymentsCallback && currentPatient) {
                onOpenPaymentsCallback(treatment, currentPatient);
            }
        });

        row.querySelector('.btn-editar-tratamiento')?.addEventListener('click', () => {
            loadTreatmentIntoForm(treatment);
        });

        row.querySelector('.btn-eliminar-tratamiento')?.addEventListener('click', () => {
            if (onDeleteTreatmentCallback && currentPatient) {
                onDeleteTreatmentCallback(treatment.id, currentPatient.id);
            }
        });

        listElem.appendChild(row);
    });

    if (totalBadgeElem) {
        totalBadgeElem.innerHTML = `
            <div class="patient-financial-summary">
                <span>Costo: <strong>${formatCurrency(totalCost)}</strong></span>
                <span class="summary-sep">|</span>
                <span class="text-success">Abonado: <strong>${formatCurrency(totalPaid)}</strong></span>
                <span class="summary-sep">|</span>
                <span class="${totalBalance > 0 ? 'text-danger' : 'text-success'}">Saldo: <strong>${formatCurrency(totalBalance)}</strong></span>
            </div>
        `;
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
