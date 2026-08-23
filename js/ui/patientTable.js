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
 * Sets up live search filtering on the patients table.
 */
function setupSearchFilter() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    searchInput.addEventListener('keyup', function () {
        const filter = this.value.toLowerCase().trim();
        const rows = document.querySelectorAll('#patientsList tr');
        rows.forEach(row => {
            row.style.display = row.innerText.toLowerCase().includes(filter) ? '' : 'none';
        });
    });
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

    patients.forEach(patient => {
        patientsCache.set(patient.id, patient);
        appendPatientRow(patient);
    });
}

/**
 * Appends a single patient row to the table.
 * @param {Object} patient - Patient data object.
 */
export function appendPatientRow(patient) {
    const listContainer = document.getElementById('patientsList');
    if (!listContainer) return;

    patientsCache.set(patient.id, patient);

    // Remove existing row if updating
    const existingRow = document.querySelector(`tr[data-patient-id="${patient.id}"]`);
    if (existingRow) {
        existingRow.remove();
    }

    const row = document.createElement('tr');
    row.setAttribute('data-patient-id', patient.id);

    row.innerHTML = `
        <td><strong>${escapeHtml(patient.full_name || '')}</strong></td>
        <td>${escapeHtml(patient.dni || '')}</td>
        <td>${formatDate(patient.birth_date)}</td>
        <td>${escapeHtml(patient.email || '-')}</td>
        <td>${escapeHtml(patient.phone || '-')}</td>
        <td>${escapeHtml(patient.neighborhood || '-')}</td>
        <td>${escapeHtml(patient.health_insurance || '-')}</td>
        <td>${escapeHtml(patient.copayment || '-')}</td>
        <td class="action-buttons-cell">
            <button type="button" class="btn-historial" data-action="history" data-id="${patient.id}" title="Ver Historial Clínico">
                <i class="fas fa-notes-medical"></i> Historial
            </button>
            <button type="button" class="btn-modificar" data-action="edit" data-id="${patient.id}" title="Modificar datos">
                Modificar
            </button>
            <button type="button" class="btn-eliminar" data-action="delete" data-id="${patient.id}" title="Eliminar paciente">
                Eliminar
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
