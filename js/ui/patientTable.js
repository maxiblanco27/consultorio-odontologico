/**
 * @file patientTable.js
 * @description UI component for rendering the patients table, search filtering, and row actions.
 */

import { formatDate } from '../utils/formatters.js';

// Internal cache for loaded patients to enable quick lookups
const patientsCache = new Map();

// Action handler callbacks
let onEditPatientCallback = null;
let onDeletePatientCallback = null;
let onOpenHistoryCallback = null;

/**
 * Initializes the patients table with action listeners and search filtering.
 * @param {Object} options - Action callback functions.
 * @param {Function} options.onEditPatient - Called when "Modificar" is clicked with patient data.
 * @param {Function} options.onDeletePatient - Called when "Eliminar" is clicked with patient ID.
 * @param {Function} options.onOpenHistory - Called when "Historial" is clicked with patient data.
 */
export function initPatientTable({ onEditPatient, onDeletePatient, onOpenHistory }) {
    onEditPatientCallback = onEditPatient;
    onDeletePatientCallback = onDeletePatient;
    onOpenHistoryCallback = onOpenHistory;

    setupSearchFilter();
}

/**
 * Stores or retrieves a patient from the cache.
 * @param {number|string} id - Patient ID.
 * @returns {Object|undefined} Patient object if found.
 */
export function getCachedPatient(id) {
    return patientsCache.get(Number(id));
}

/**
 * Recalculates visual zebra striping parity (data-row-parity="odd|even") across currently visible patient rows.
 */
export function recalculatePatientRowsParity() {
    const rows = document.querySelectorAll('#patientsList tr');
    let visibleIndex = 0;
    rows.forEach(row => {
        const isHidden = row.classList.contains('is-hidden') || row.style.display === 'none';
        if (!isHidden) {
            row.setAttribute('data-row-parity', visibleIndex % 2 === 0 ? 'odd' : 'even');
            visibleIndex++;
        } else {
            row.removeAttribute('data-row-parity');
        }
    });
}

/**
 * Sets up live search filtering on the patients table with dynamic zebra striping recalculation.
 */
function setupSearchFilter() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    const filterRows = () => {
        const filter = searchInput.value.toLowerCase().trim();
        const rows = document.querySelectorAll('#patientsList tr');
        let visibleCount = 0;

        rows.forEach(row => {
            const matches = !filter || row.innerText.toLowerCase().includes(filter);
            if (matches) {
                row.style.display = '';
                row.classList.remove('is-hidden');
                row.setAttribute('data-row-parity', visibleCount % 2 === 0 ? 'odd' : 'even');
                visibleCount++;
            } else {
                row.style.display = 'none';
                row.classList.add('is-hidden');
                row.removeAttribute('data-row-parity');
            }
        });
    };

    searchInput.addEventListener('input', filterRows);
    searchInput.addEventListener('keyup', filterRows);
}

/**
 * Renders an array of patients into the table body.
 * @param {Array<Object>} patients - List of patient objects from database.
 */
export function renderPatientsTable(patients) {
    const listContainer = document.getElementById('patientsList');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    patientsCache.clear();

    patients.forEach((patient, index) => {
        patientsCache.set(patient.id, patient);
        appendPatientRow(patient, false);
    });

    const searchInput = document.getElementById('searchInput');
    if (searchInput && searchInput.value.trim() !== '') {
        searchInput.dispatchEvent(new Event('input'));
    } else {
        recalculatePatientRowsParity();
    }
}

/**
 * Appends a single patient row to the table.
 * @param {Object} patient - Patient data object.
 * @param {boolean} [recalcParity=true] - Whether to recalibrate visible row parity immediately.
 */
export function appendPatientRow(patient, recalcParity = true) {
    const listContainer = document.getElementById('patientsList');
    if (!listContainer) return;

    patientsCache.set(patient.id, patient);

    // Remove existing row if updating
    const existingRow = document.querySelector(`tr[data-patient-id="${patient.id}"]`);
    if (existingRow) {
        existingRow.remove();
    }

    const treatmentsCount = typeof patient.treatments_count === 'number'
        ? patient.treatments_count
        : (Array.isArray(patient.treatments) && patient.treatments.length > 0 && typeof patient.treatments[0]?.count === 'number'
            ? patient.treatments[0].count
            : 0);

    const treatmentNoun = treatmentsCount === 1 ? 'tratamiento registrado' : 'tratamientos registrados';
    const ariaLabel = `Historial de tratamientos, ${treatmentsCount} ${treatmentNoun}`;
    const titleText = `Ver Historial Clínico (${treatmentsCount} ${treatmentsCount === 1 ? 'tratamiento' : 'tratamientos'})`;
    const badgeClass = treatmentsCount > 0 ? 'badge-active' : 'badge-zero';

    const row = document.createElement('tr');
    row.setAttribute('data-patient-id', patient.id);

    row.innerHTML = `
        <td><strong>${escapeHtml(patient.full_name || '')}</strong></td>
        <td>${escapeHtml(patient.dni || '')}</td>
        <td>${formatDate(patient.birth_date)}</td>
        <td>${escapeHtml(patient.phone || '-')}</td>
        <td>${escapeHtml(patient.health_insurance || '-')}</td>
        <td class="action-buttons-cell">
            <button type="button" class="btn-historial" data-action="history" data-id="${patient.id}" title="${titleText}" aria-label="${ariaLabel}">
                <i class="fas fa-notes-medical"></i>
                <span>Historial</span>
                <span class="treatment-badge ${badgeClass}">${treatmentsCount}</span>
            </button>
            <button type="button" class="btn-modificar" data-action="edit" data-id="${patient.id}" title="Ver y modificar datos del paciente">
                <i class="fas fa-user-edit"></i> Ver Paciente
            </button>
            <button type="button" class="btn-eliminar" data-action="delete" data-id="${patient.id}" title="Eliminar paciente">
                <i class="fas fa-trash-alt"></i> Eliminar
            </button>
        </td>
    `;

    // Attach event listeners via delegation on the row
    row.querySelector('[data-action="history"]')?.addEventListener('click', () => {
        if (onOpenHistoryCallback) onOpenHistoryCallback(patient);
    });

    row.querySelector('[data-action="edit"]')?.addEventListener('click', () => {
        if (onEditPatientCallback) onEditPatientCallback(patient);
    });

    row.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
        if (onDeletePatientCallback) onDeletePatientCallback(patient.id);
    });

    listContainer.appendChild(row);

    if (recalcParity) {
        recalculatePatientRowsParity();
    }
}

/**
 * Removes a patient row from the table and clears it from cache.
 * @param {number|string} patientId - ID of the deleted patient.
 */
export function removePatientRow(patientId) {
    const numId = Number(patientId);
    patientsCache.delete(numId);
    const row = document.querySelector(`tr[data-patient-id="${patientId}"]`);
    if (row) {
        row.remove();
    }
    recalculatePatientRowsParity();
}

/**
 * Helper to escape HTML characters to prevent XSS injection.
 * @param {string} str - Raw string.
 * @returns {string} Escaped string.
 */
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
