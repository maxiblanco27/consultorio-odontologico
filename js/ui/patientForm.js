/**
 * @file patientForm.js
 * @description UI component for handling the patient registration and edition form.
 */

let currentEditingId = null;
let onSubmitHandler = null;

/**
 * Initializes the patient form and attaches submit event listener.
 * @param {Object} options - Configuration options.
 * @param {Function} options.onSubmit - Callback function invoked with { isEdit, patientId, formData }.
 */
export function initPatientForm({ onSubmit }) {
    onSubmitHandler = onSubmit;
    const form = document.getElementById('patientForm');

    if (!form) {
        console.error("DOM Error: 'patientForm' element not found in HTML.");
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            full_name: document.getElementById('fullName').value.trim(),
            dni: document.getElementById('dni').value.trim(),
            birth_date: document.getElementById('birthDate').value,
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            neighborhood: document.getElementById('neighborhood').value.trim(),
            health_insurance: document.getElementById('healthInsurance').value.trim(),
            copayment: document.getElementById('copayment').value.trim(),
            treatment: document.getElementById('treatment').value.trim()
        };

        if (onSubmitHandler) {
            await onSubmitHandler({
                isEdit: Boolean(currentEditingId),
                patientId: currentEditingId,
                formData
            });
        }
    });
}

/**
 * Loads a patient's data into the form inputs for editing.
 * @param {Object} patient - Patient data object to populate into the form.
 */
export function loadPatientIntoForm(patient) {
    if (!patient) return;

    document.getElementById('fullName').value = patient.full_name || '';
    document.getElementById('dni').value = patient.dni || '';
    document.getElementById('birthDate').value = patient.birth_date || '';
    document.getElementById('email').value = patient.email || '';
    document.getElementById('phone').value = patient.phone || '';
    document.getElementById('neighborhood').value = patient.neighborhood || '';
    document.getElementById('healthInsurance').value = patient.health_insurance || '';
    document.getElementById('copayment').value = patient.copayment || '';
    document.getElementById('treatment').value = patient.treatment || '';

    currentEditingId = patient.id;

    // Update save button to Edit Mode
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.textContent = 'Actualizar Paciente';
        saveBtn.className = 'btn-guardar btn-actualizar-mode';
    }

    // Show or create Cancel Edit button
    let cancelBtn = document.getElementById('cancelEditBtn');
    if (!cancelBtn) {
        cancelBtn = document.createElement('button');
        cancelBtn.id = 'cancelEditBtn';
        cancelBtn.type = 'button';
        cancelBtn.textContent = 'Cancelar Edición';
        cancelBtn.className = 'btn-cancelar-edicion';
        cancelBtn.addEventListener('click', resetPatientForm);
        document.getElementById('patientForm').appendChild(cancelBtn);
    }
    cancelBtn.style.display = 'block';

    // Smooth scroll to form top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Resets the patient form inputs and UI state back to Create Mode.
 */
export function resetPatientForm() {
    const form = document.getElementById('patientForm');
    if (form) form.reset();

    currentEditingId = null;

    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Guardar en el Historial';
        saveBtn.className = 'btn-guardar';
    }

    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.style.display = 'none';
    }
}

/**
 * Sets the loading state on the save button.
 * @param {boolean} isLoading - Whether the form is submitting.
 */
export function setFormLoading(isLoading) {
    const saveBtn = document.getElementById('saveBtn');
    if (!saveBtn) return;

    saveBtn.disabled = isLoading;
    if (isLoading) {
        saveBtn.textContent = currentEditingId ? 'Actualizando...' : 'Guardando...';
    } else {
        saveBtn.textContent = currentEditingId ? 'Actualizar Paciente' : 'Guardar en el Historial';
    }
}

/**
 * Gets the current patient ID being edited.
 * @returns {number|string|null}
 */
export function getCurrentlyEditingId() {
    return currentEditingId;
}
