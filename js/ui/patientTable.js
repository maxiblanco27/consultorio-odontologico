/**
 * @file patientTable.js
 * @description UI component for rendering the patients table, search filtering, pagination,
 * global volume metric indicator, and row actions.
 */

import { formatDate } from '../utils/formatters.js';

// Internal cache for loaded patients to enable quick lookups
const patientsCache = new Map();

// Master list and active filtered list
let allPatients = [];
let filteredPatients = [];

// Pagination state
let currentPage = 1;
let pageSize = 10;
let currentFilter = '';

// Action handler callbacks
let onEditPatientCallback = null;
let onDeletePatientCallback = null;
let onOpenHistoryCallback = null;

/**
 * Initializes the patients table with action listeners, search filtering, and pagination controls.
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
    setupPaginationControls();
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
 * Scrolls the table container smoothly or immediately to the top.
 */
export function resetTableScroll() {
    const container = document.getElementById('patientTableContainer');
    if (container) {
        container.scrollTop = 0;
    }
}

/**
 * Recalculates visual zebra striping parity (data-row-parity="odd|even") across currently visible patient rows.
 */
export function recalculatePatientRowsParity() {
    const rows = document.querySelectorAll('#patientsList tr:not(.table-empty-row)');
    rows.forEach((row, index) => {
        row.setAttribute('data-row-parity', index % 2 === 0 ? 'odd' : 'even');
    });
}

/**
 * Updates the total volume indicator badge in the section header.
 */
function updateVolumeIndicator() {
    const badge = document.getElementById('patientVolumeBadge');
    const textSpan = document.getElementById('patientVolumeText');
    if (!badge || !textSpan) return;

    const totalRegistered = allPatients.length;
    const isFiltered = currentFilter.trim().length > 0;

    if (isFiltered) {
        const matchesCount = filteredPatients.length;
        const resultNoun = matchesCount === 1 ? 'resultado encontrado' : 'resultados encontrados';
        badge.classList.add('is-filtered');
        badge.innerHTML = `<i class="fas fa-search"></i> <span id="patientVolumeText">${matchesCount} ${resultNoun} de ${totalRegistered} pacientes</span>`;
    } else {
        badge.classList.remove('is-filtered');
        badge.innerHTML = `<i class="fas fa-users"></i> <span id="patientVolumeText">Total de pacientes registrados: ${totalRegistered}</span>`;
    }
}

/**
 * Updates pagination navigation buttons, indicator and range summary text.
 */
function updatePaginationUI() {
    const rangeText = document.getElementById('paginationRangeText');
    const pageIndicator = document.getElementById('paginationCurrentPage');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');

    const totalItems = filteredPatients.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    // Clamp current page
    if (currentPage > totalPages) {
        currentPage = totalPages;
    }
    if (currentPage < 1) {
        currentPage = 1;
    }

    // 1. Range Summary Text
    if (rangeText) {
        if (totalItems === 0) {
            rangeText.textContent = allPatients.length === 0
                ? 'Mostrando 0 de 0 pacientes'
                : `0 resultados encontrados (de ${allPatients.length} pacientes)`;
        } else {
            const start = (currentPage - 1) * pageSize + 1;
            const end = Math.min(currentPage * pageSize, totalItems);
            if (currentFilter.trim().length > 0) {
                rangeText.textContent = `Mostrando ${start} al ${end} de ${totalItems} pacientes encontrados (${allPatients.length} total)`;
            } else {
                rangeText.textContent = `Mostrando ${start} al ${end} de ${allPatients.length} pacientes`;
            }
        }
    }

    // 2. Page Indicator
    if (pageIndicator) {
        pageIndicator.textContent = `Página ${totalItems === 0 ? 0 : currentPage} de ${totalItems === 0 ? 0 : totalPages}`;
    }

    // 3. Navigation Buttons State
    if (prevBtn) {
        prevBtn.disabled = currentPage <= 1 || totalItems === 0;
    }
    if (nextBtn) {
        nextBtn.disabled = currentPage >= totalPages || totalItems === 0;
    }
}

/**
 * Renders the visible slice of rows for the current page into the table body.
 */
function renderCurrentPage() {
    const listContainer = document.getElementById('patientsList');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    const totalItems = filteredPatients.length;
    if (totalItems === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.className = 'table-empty-row';
        const message = allPatients.length === 0
            ? '<i class="fas fa-users-slash"></i> No hay pacientes registrados.'
            : '<i class="fas fa-search"></i> No se encontraron pacientes que coincidan con la búsqueda.';
        emptyRow.innerHTML = `<td colspan="6">${message}</td>`;
        listContainer.appendChild(emptyRow);
        return;
    }

    const startIndex = (currentPage - 1) * pageSize;
    const pagePatients = filteredPatients.slice(startIndex, startIndex + pageSize);

    pagePatients.forEach(patient => {
        const row = createPatientRowElement(patient);
        listContainer.appendChild(row);
    });

    recalculatePatientRowsParity();
}

/**
 * Creates and returns a DOM <tr> element for a patient.
 * @param {Object} patient - Patient data object.
 * @returns {HTMLTableRowElement}
 */
function createPatientRowElement(patient) {
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

    return row;
}

/**
 * Filters the master patients array according to the current filter text.
 */
function applyCurrentFilter() {
    const filter = currentFilter.toLowerCase().trim();
    if (!filter) {
        filteredPatients = [...allPatients];
    } else {
        filteredPatients = allPatients.filter(patient => {
            const name = (patient.full_name || '').toLowerCase();
            const dni = (patient.dni || '').toLowerCase();
            const phone = (patient.phone || '').toLowerCase();
            const insurance = (patient.health_insurance || '').toLowerCase();
            return name.includes(filter) || dni.includes(filter) || phone.includes(filter) || insurance.includes(filter);
        });
    }
}

/**
 * Sets up live search filtering on the patients table with pagination and scroll reset.
 */
function setupSearchFilter() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    const handleSearch = () => {
        currentFilter = searchInput.value;
        applyCurrentFilter();
        currentPage = 1;
        renderCurrentPage();
        updatePaginationUI();
        updateVolumeIndicator();
        resetTableScroll();
    };

    searchInput.addEventListener('input', handleSearch);
    searchInput.addEventListener('keyup', handleSearch);
}

/**
 * Sets up pagination navigation buttons and page size selection.
 */
function setupPaginationControls() {
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    const pageSizeSelect = document.getElementById('pageSizeSelect');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderCurrentPage();
                updatePaginationUI();
                resetTableScroll();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.max(1, Math.ceil(filteredPatients.length / pageSize));
            if (currentPage < totalPages) {
                currentPage++;
                renderCurrentPage();
                updatePaginationUI();
                resetTableScroll();
            }
        });
    }

    if (pageSizeSelect) {
        pageSizeSelect.addEventListener('change', () => {
            const selectedSize = parseInt(pageSizeSelect.value, 10);
            if (!isNaN(selectedSize) && selectedSize > 0) {
                pageSize = selectedSize;
                currentPage = 1;
                renderCurrentPage();
                updatePaginationUI();
                resetTableScroll();
            }
        });
    }
}

/**
 * Renders an array of patients into the table, resetting or maintaining the current view.
 * @param {Array<Object>} patients - List of patient objects from database.
 */
export function renderPatientsTable(patients) {
    allPatients = Array.isArray(patients) ? [...patients] : [];

    // Repopulate cache
    patientsCache.clear();
    allPatients.forEach(patient => {
        patientsCache.set(patient.id, patient);
    });

    // Check if there is an existing search input value
    const searchInput = document.getElementById('searchInput');
    currentFilter = searchInput ? searchInput.value : '';

    applyCurrentFilter();

    // Ensure currentPage is valid
    const totalPages = Math.max(1, Math.ceil(filteredPatients.length / pageSize));
    if (currentPage > totalPages) {
        currentPage = totalPages;
    }
    if (currentPage < 1) {
        currentPage = 1;
    }

    renderCurrentPage();
    updatePaginationUI();
    updateVolumeIndicator();
}

/**
 * Appends or updates a single patient in the data list, updating cache, pagination, and view.
 * @param {Object} patient - Patient data object.
 * @param {boolean} [recalcParity=true] - Kept for backwards compatibility.
 */
export function appendPatientRow(patient, recalcParity = true) {
    if (!patient || !patient.id) return;

    patientsCache.set(patient.id, patient);

    const existingIndex = allPatients.findIndex(p => p.id === patient.id);
    if (existingIndex !== -1) {
        allPatients[existingIndex] = { ...allPatients[existingIndex], ...patient };
    } else {
        // Prepend newest patient
        allPatients.unshift(patient);
    }

    applyCurrentFilter();

    // Display newly added patient on page 1
    currentPage = 1;
    renderCurrentPage();
    updatePaginationUI();
    updateVolumeIndicator();
    resetTableScroll();
}

/**
 * Removes a patient row from the dataset and cache, adjusting pagination and view.
 * @param {number|string} patientId - ID of the deleted patient.
 */
export function removePatientRow(patientId) {
    const numId = Number(patientId);
    patientsCache.delete(numId);

    allPatients = allPatients.filter(p => p.id !== numId);
    applyCurrentFilter();

    const totalPages = Math.max(1, Math.ceil(filteredPatients.length / pageSize));
    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    renderCurrentPage();
    updatePaginationUI();
    updateVolumeIndicator();
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
