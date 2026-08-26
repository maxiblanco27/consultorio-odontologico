/**
 * @file paymentModal.js
 * @description UI component for managing treatment payments modal, financial summary dashboard, and payment records.
 */

import { formatCurrency, formatDate, getTodayDateString } from '../utils/formatters.js';
import { showPaymentModalAlert } from './alertBanner.js';

let currentTreatment = null;
let currentPatient = null;
let onAddPaymentCallback = null;
let onDeletePaymentCallback = null;

/**
 * Initializes the payment modal event listeners and form handlers.
 * @param {Object} options - Action callbacks.
 * @param {Function} options.onAddPayment - Invoked with payment payload.
 * @param {Function} options.onDeletePayment - Invoked with (paymentId, treatmentId).
 */
export function initPaymentModal({ onAddPayment, onDeletePayment }) {
    onAddPaymentCallback = onAddPayment;
    onDeletePaymentCallback = onDeletePayment;

    const modalOverlay = document.getElementById('paymentModal');
    const newPaymentForm = document.getElementById('newPaymentForm');
    const closeBtn = document.getElementById('closePaymentModalBtn');
    const closeFooterBtn = document.getElementById('closePaymentModalFooterBtn');
    const quickFillBtn = document.getElementById('btnFillTotalBalance');

    // Close on backdrop click
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closePaymentModal();
            }
        });
    }

    // Close buttons
    closeBtn?.addEventListener('click', closePaymentModal);
    closeFooterBtn?.addEventListener('click', closePaymentModal);

    // Escape key listener
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isPaymentModalOpen()) {
            e.stopPropagation(); // Avoid closing parent treatment modal simultaneously
            closePaymentModal();
        }
    });

    // Quick Fill "Total" remaining balance button
    if (quickFillBtn) {
        quickFillBtn.addEventListener('click', () => {
            if (!currentTreatment) return;
            const balanceVal = currentTreatment.balance !== undefined && currentTreatment.balance !== null 
                ? parseFloat(currentTreatment.balance) 
                : parseFloat(currentTreatment.cost || 0);

            if (balanceVal <= 0) {
                showPaymentModalAlert('Este tratamiento ya se encuentra totalmente saldado.', true);
                return;
            }

            const paymentAmountInput = document.getElementById('paymentAmount');
            if (paymentAmountInput) {
                paymentAmountInput.value = balanceVal.toFixed(2);
                paymentAmountInput.focus();
            }
        });
    }

    // New Payment Form submission
    if (newPaymentForm) {
        newPaymentForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!currentTreatment) {
                showPaymentModalAlert('Error: No se ha seleccionado un tratamiento válido.');
                return;
            }

            const paymentDateInput = document.getElementById('paymentDate');
            const paymentAmountInput = document.getElementById('paymentAmount');
            const paymentNotesInput = document.getElementById('paymentNotes');
            const saveBtn = document.getElementById('savePaymentBtn');

            const paymentDate = paymentDateInput.value.trim();
            const amountVal = parseFloat(paymentAmountInput.value);
            const notes = paymentNotesInput.value.trim();

            const currentBalance = currentTreatment.balance !== undefined && currentTreatment.balance !== null
                ? parseFloat(currentTreatment.balance)
                : parseFloat(currentTreatment.cost || 0);

            // Validations
            if (!paymentDate) {
                showPaymentModalAlert('Debe indicar la fecha del aporte.');
                return;
            }

            if (isNaN(amountVal) || amountVal <= 0) {
                showPaymentModalAlert('El importe del aporte debe ser un valor numérico mayor a 0.');
                return;
            }

            if (currentBalance <= 0) {
                showPaymentModalAlert('El tratamiento ya está saldado. No es posible registrar nuevos aportes.');
                return;
            }

            if (amountVal > currentBalance + 0.001) {
                showPaymentModalAlert(
                    `El importe (${formatCurrency(amountVal)}) no puede exceder el saldo restante (${formatCurrency(currentBalance)}).`
                );
                return;
            }

            const paymentData = {
                treatment_id: currentTreatment.id,
                payment_date: paymentDate,
                amount: amountVal,
                notes: notes
            };

            try {
                if (saveBtn) {
                    saveBtn.disabled = true;
                    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
                }

                if (onAddPaymentCallback) {
                    const success = await onAddPaymentCallback(paymentData);
                    if (success) {
                        // Reset input fields
                        if (paymentAmountInput) paymentAmountInput.value = '';
                        if (paymentNotesInput) paymentNotesInput.value = '';
                        if (paymentDateInput) paymentDateInput.value = getTodayDateString();
                    }
                }
            } finally {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = '<i class="fas fa-hand-holding-usd"></i> Registrar Aporte';
                }
            }
        });
    }
}

/**
 * Checks if the payment modal is currently visible.
 * @returns {boolean}
 */
export function isPaymentModalOpen() {
    const modalOverlay = document.getElementById('paymentModal');
    return modalOverlay && modalOverlay.style.display === 'flex';
}

/**
 * Opens the payments modal for a specific treatment.
 * @param {Object} treatment - The treatment data object.
 * @param {Object} patient - The patient data object.
 * @param {Array<Object>} payments - Initial list of payments.
 */
export function openPaymentModal(treatment, patient, payments = []) {
    currentTreatment = treatment;
    currentPatient = patient;

    const modalTitle = document.getElementById('paymentModalTitle');
    const modalSubtitle = document.getElementById('paymentModalSubtitle');
    const modalAlert = document.getElementById('paymentModalAlertMessage');
    const modalOverlay = document.getElementById('paymentModal');
    const paymentDateInput = document.getElementById('paymentDate');
    const paymentAmountInput = document.getElementById('paymentAmount');
    const paymentNotesInput = document.getElementById('paymentNotes');

    if (modalTitle) {
        modalTitle.innerHTML = '<i class="fas fa-hand-holding-dollar"></i> Gestión de Aportes Económicos';
    }

    if (modalSubtitle) {
        const desc = treatment.description ? `Tratamiento: "${treatment.description}"` : 'Tratamiento';
        const dateStr = formatDate(treatment.treatment_date);
        const patientName = patient ? patient.full_name : '-';
        modalSubtitle.textContent = `${desc} (${dateStr}) | Paciente: ${patientName}`;
    }

    if (paymentDateInput) paymentDateInput.value = getTodayDateString();
    if (paymentAmountInput) paymentAmountInput.value = '';
    if (paymentNotesInput) paymentNotesInput.value = '';
    if (modalAlert) modalAlert.style.display = 'none';

    updatePaymentModalState(treatment, payments);

    if (modalOverlay) {
        modalOverlay.style.display = 'flex';
    }
}

/**
 * Closes the payment modal.
 */
export function closePaymentModal() {
    currentTreatment = null;
    currentPatient = null;
    const modalOverlay = document.getElementById('paymentModal');
    if (modalOverlay) {
        modalOverlay.style.display = 'none';
    }
}

/**
 * Updates the modal UI state with fresh treatment details and payments.
 * @param {Object} treatment - Updated treatment object.
 * @param {Array<Object>} payments - Updated payments array.
 */
export function updatePaymentModalState(treatment, payments = []) {
    currentTreatment = treatment;

    const cost = parseFloat(treatment.cost) || 0;
    const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const balance = treatment.balance !== undefined && treatment.balance !== null
        ? parseFloat(treatment.balance)
        : Math.max(0, cost - totalPaid);

    currentTreatment.balance = balance;

    renderPaymentsSummary(cost, totalPaid, balance);
    renderPaymentsList(payments);
}

/**
 * Sets the loading state for the payments list.
 * @param {boolean} isLoading - Loading indicator.
 */
export function setPaymentsLoading(isLoading) {
    const loadingElem = document.getElementById('paymentsLoading');
    const emptyElem = document.getElementById('paymentsEmpty');
    const tableElem = document.getElementById('paymentsTable');

    if (isLoading) {
        if (loadingElem) loadingElem.style.display = 'block';
        if (emptyElem) emptyElem.style.display = 'none';
        if (tableElem) tableElem.style.display = 'none';
    } else {
        if (loadingElem) loadingElem.style.display = 'none';
    }
}

/**
 * Renders the financial dashboard summary stat cards.
 * @param {number} cost - Total treatment cost.
 * @param {number} totalPaid - Total paid so far.
 * @param {number} balance - Remaining balance.
 */
export function renderPaymentsSummary(cost, totalPaid, balance) {
    const costElem = document.getElementById('paymentSummaryCost');
    const paidElem = document.getElementById('paymentSummaryPaid');
    const balanceElem = document.getElementById('paymentSummaryBalance');
    const balanceCard = document.getElementById('paymentSummaryBalanceCard');
    const quickFillBtn = document.getElementById('btnFillTotalBalance');
    const saveBtn = document.getElementById('savePaymentBtn');
    const paymentAmountInput = document.getElementById('paymentAmount');

    if (costElem) costElem.textContent = formatCurrency(cost);
    if (paidElem) paidElem.textContent = formatCurrency(totalPaid);
    if (balanceElem) balanceElem.textContent = formatCurrency(balance);

    if (balanceCard) {
        balanceCard.classList.remove('is-paid', 'is-pending');
        if (balance <= 0) {
            balanceCard.classList.add('is-paid');
            balanceCard.querySelector('.stat-label').innerHTML = '<i class="fas fa-check-circle"></i> Estado';
            if (balanceElem) balanceElem.innerHTML = '<span class="badge-status badge-paid"><i class="fas fa-check"></i> Saldado</span>';
        } else {
            balanceCard.classList.add('is-pending');
            balanceCard.querySelector('.stat-label').innerHTML = '<i class="fas fa-clock"></i> Saldo Pendiente';
        }
    }

    if (quickFillBtn) {
        if (balance <= 0) {
            quickFillBtn.style.opacity = '0.5';
            quickFillBtn.disabled = true;
        } else {
            quickFillBtn.style.opacity = '1';
            quickFillBtn.disabled = false;
            quickFillBtn.title = `Autocompletar saldo total de ${formatCurrency(balance)}`;
        }
    }

    if (paymentAmountInput) {
        if (balance <= 0) {
            paymentAmountInput.disabled = true;
            paymentAmountInput.placeholder = 'Tratamiento saldado';
            if (saveBtn) saveBtn.disabled = true;
        } else {
            paymentAmountInput.disabled = false;
            paymentAmountInput.placeholder = '0.00';
            paymentAmountInput.max = balance;
            if (saveBtn) saveBtn.disabled = false;
        }
    }
}

/**
 * Renders the list of payments in the history table.
 * @param {Array<Object>} payments - Array of payment records.
 */
export function renderPaymentsList(payments) {
    const emptyElem = document.getElementById('paymentsEmpty');
    const tableElem = document.getElementById('paymentsTable');
    const listElem = document.getElementById('paymentsList');

    if (!listElem) return;

    listElem.innerHTML = '';

    if (!payments || payments.length === 0) {
        if (emptyElem) emptyElem.style.display = 'block';
        if (tableElem) tableElem.style.display = 'none';
        return;
    }

    payments.forEach(payment => {
        const row = document.createElement('tr');
        row.setAttribute('data-payment-id', payment.id);

        row.innerHTML = `
            <td><strong>${formatDate(payment.payment_date)}</strong></td>
            <td><strong class="text-success">${formatCurrency(payment.amount)}</strong></td>
            <td>${escapeHtml(payment.notes || '-')}</td>
            <td class="text-center">
                <button type="button" class="btn-eliminar-pago" data-id="${payment.id}" title="Anular este aporte">
                    <i class="fas fa-trash-alt"></i> Anular
                </button>
            </td>
        `;

        row.querySelector('.btn-eliminar-pago')?.addEventListener('click', () => {
            if (onDeletePaymentCallback && currentTreatment) {
                onDeletePaymentCallback(payment.id, currentTreatment.id, payment.amount);
            }
        });

        listElem.appendChild(row);
    });

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
