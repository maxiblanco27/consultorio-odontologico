// ==========================================
// ENVIRONMENT CONFIGURATION
// ==========================================

// ⚠️ REPLACE THIS with your actual production Vercel URL (without https://)
// Example: 'consultorio-nonadoc.vercel.app'
const PROD_HOSTNAME = 'consultorio-odontologico-omega.vercel.app';

let SUPABASE_URL = '';
let SUPABASE_KEY = '';

// Dynamically assign database credentials based on the current hostname
if (window.location.hostname === PROD_HOSTNAME) {
    // 🔴 PRODUCTION DATABASE (Real Patients)
    SUPABASE_URL = 'https://alsurmvechfporxbzaed.supabase.co';
    SUPABASE_KEY = 'sb_publishable_OTdYnJp9o9QXC6MxhVII7w_0SShMN1n';
} else {
    // 🟢 STAGING / LOCALHOST DATABASE (Test Patients)
    // ⚠️ PASTE YOUR NEW SUPABASE PROJECT URL AND KEY HERE para tu consultorio-db-test
    SUPABASE_URL = 'https://vlwcmikacyeggiatdilx.supabase.co';
    SUPABASE_KEY = 'sb_publishable_dQRb-ULM2i2r6hKNznUk2A_nwe4Mr4F';
}

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Show Test Environment Banner
if (window.location.hostname !== PROD_HOSTNAME) {
    document.addEventListener('DOMContentLoaded', () => {
        const banner = document.createElement('div');
        banner.style.backgroundColor = '#f8d7da';
        banner.style.color = '#721c24';
        banner.style.padding = '15px';
        banner.style.textAlign = 'center';
        banner.style.fontWeight = 'bold';
        banner.style.borderBottom = '2px solid #f5c6cb';
        banner.style.zIndex = '9999';
        banner.style.position = 'relative';
        banner.innerHTML = `
            Atención: Ud. está en una versión de prueba. 
            <a href="https://${PROD_HOSTNAME}" style="background-color: #721c24; color: #fff; padding: 5px 10px; border-radius: 4px; text-decoration: none; margin-left: 10px; font-size: 14px;">
                Para acceder al sistema real haga click aquí
            </a>
        `;
        document.body.insertBefore(banner, document.body.firstChild);
    });
}

// ==========================================
// GLOBAL STATE VARIABLES
// ==========================================
let editingPatientId = null; // Tracks the ID of the patient currently being edited. null = Create mode
const patientsDataMap = new Map(); // Stores loaded patient objects for quick access without refetching

// Utility function to display UI alerts
function showAlert(message, isError = true) {
    const alertContainer = document.getElementById('alertMessage');
    if (!alertContainer) return;

    alertContainer.textContent = message;
    alertContainer.style.display = 'block';

    if (isError) {
        alertContainer.style.backgroundColor = '#f8d7da';
        alertContainer.style.color = '#721c24';
        alertContainer.style.border = '1px solid #f5c6cb';
    } else {
        alertContainer.style.backgroundColor = '#d4edda';
        alertContainer.style.color = '#155724';
        alertContainer.style.border = '1px solid #c3e6cb';
    }

    // Hide alert automatically after 6 seconds
    setTimeout(() => {
        alertContainer.style.display = 'none';
    }, 6000);
}

// Wrap ALL initial logic inside here
document.addEventListener('DOMContentLoaded', async () => {

    // 0. Display the version on screen
    displayAppVersion();

    // 1. Load patients on startup (only once)
    loadPatients();

    // 2. Listen for form submission
    const patientForm = document.getElementById('patientForm');
    if (patientForm) {
        patientForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const saveBtn = document.getElementById('saveBtn');

            // Gather form data
            const newPatientData = {
                full_name: document.getElementById('fullName').value,
                dni: document.getElementById('dni').value,
                birth_date: document.getElementById('birthDate').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                neighborhood: document.getElementById('neighborhood').value,
                health_insurance: document.getElementById('healthInsurance').value,
                copayment: document.getElementById('copayment').value,
                treatment: document.getElementById('treatment').value
            };

            try {
                // Disable button during submission to prevent duplicate clicks
                saveBtn.disabled = true;
                saveBtn.textContent = editingPatientId ? 'Actualizando...' : 'Guardando...';

                if (editingPatientId) {
                    // UPDATE EXISTING RECORD
                    const { error } = await supabaseClient
                        .from('patients')
                        .update(newPatientData)
                        .eq('id', editingPatientId);

                    if (error) {
                        console.error('Error updating patient:', error);
                        showAlert(`Error al actualizar el paciente: ${error.message}`);
                    } else {
                        showAlert('Paciente actualizado exitosamente.', false);
                        resetFormState();
                        loadPatients(); // Refresh the list to show updated data
                    }
                } else {
                    // INSERT NEW RECORD
                    const { data, error } = await supabaseClient
                        .from('patients')
                        .insert([newPatientData])
                        .select();

                    if (error) {
                        console.error('Error inserting patient:', error);
                        showAlert(`Error al guardar el paciente: ${error.message}`);
                    } else {
                        insertRow(data[0]);
                        patientsDataMap.set(data[0].id, data[0]); // Cache the new record
                        resetFormState();
                        showAlert('Paciente guardado exitosamente.', false);
                    }
                }
            } catch (err) {
                console.error('Unexpected error during database operation:', err);
                showAlert('No se pudo completar la operación por un fallo de conexión.');
            } finally {
                // Restore button state
                if (!editingPatientId) { // Only re-enable if we are not resetting state
                    saveBtn.disabled = false;
                    saveBtn.textContent = 'Guardar en el Historial';
                }
            }
        });
    } else {
        console.error("DOM Error: 'patientForm' element not found in HTML.");
    }

    // 3. Listen for search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', function () {
            const filter = this.value.toLowerCase();
            const rows = document.querySelectorAll('#patientsList tr');
            rows.forEach(row => {
                row.style.display = row.innerText.toLowerCase().includes(filter) ? "" : "none";
            });
        });
    }
});

// Resets form inputs, tracking IDs, and UI elements to default "Creation" state
window.resetFormState = function () {
    const form = document.getElementById('patientForm');
    if (form) form.reset();

    editingPatientId = null; // Clear edit tracking

    // Restore Main Save Button
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Guardar en el Historial';
        saveBtn.style.backgroundColor = '#28a745'; // Default green color
    }

    // Hide dynamic Cancel button if it exists
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.style.display = 'none';
    }
};

// Loads a patient's cached data into the form inputs for editing
window.loadPatientIntoForm = function (id) {
    const patient = patientsDataMap.get(id);
    if (!patient) return;

    // Populate form fields
    document.getElementById('fullName').value = patient.full_name || '';
    document.getElementById('dni').value = patient.dni || '';
    document.getElementById('birthDate').value = patient.birth_date || '';
    document.getElementById('email').value = patient.email || '';
    document.getElementById('phone').value = patient.phone || '';
    document.getElementById('neighborhood').value = patient.neighborhood || '';
    document.getElementById('healthInsurance').value = patient.health_insurance || '';
    document.getElementById('copayment').value = patient.copayment || '';
    document.getElementById('treatment').value = patient.treatment || '';

    // Set tracking ID
    editingPatientId = id;

    // Update UI to indicate Edit Mode
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.textContent = 'Actualizar Paciente';
    saveBtn.style.backgroundColor = '#007bff'; // Change to blue

    // Dynamically create or show a "Cancel" button
    let cancelBtn = document.getElementById('cancelEditBtn');
    if (!cancelBtn) {
        cancelBtn = document.createElement('button');
        cancelBtn.id = 'cancelEditBtn';
        cancelBtn.type = 'button';
        cancelBtn.textContent = 'Cancelar Edición';
        cancelBtn.style.backgroundColor = '#6c757d'; // Gray color
        cancelBtn.style.color = 'white';
        cancelBtn.style.border = 'none';
        cancelBtn.style.padding = '12px';
        cancelBtn.style.borderRadius = '5px';
        cancelBtn.style.cursor = 'pointer';
        cancelBtn.style.width = '100%';
        cancelBtn.style.marginTop = '10px';
        cancelBtn.style.fontWeight = 'bold';
        cancelBtn.onclick = window.resetFormState;
        document.getElementById('patientForm').appendChild(cancelBtn);
    }
    cancelBtn.style.display = 'block';

    // Smooth scroll to the top of the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Fetch active patients from Supabase and render them
async function loadPatients() {
    const listContainer = document.getElementById('patientsList');

    if (!listContainer) {
        console.error("DOM Error: 'patientsList' table not found in HTML.");
        return;
    }

    listContainer.innerHTML = '';
    patientsDataMap.clear();

    try {
        const { data: patients, error } = await supabaseClient
            .from('patients')
            .select('*')
            .eq('is_active', true) // ⚠️ FILTRO DE ELIMINACIÓN VIRTUAL
            .order('id', { ascending: false });

        if (error) {
            console.error('Error fetching patients:', error);
            showAlert(`No se pudo conectar a la base de datos: ${error.message || 'Verifique su conexión o credenciales.'}`);
            return;
        }

        patients.forEach(patient => {
            patientsDataMap.set(patient.id, patient);
            insertRow(patient);
        });
    } catch (err) {
        console.error('Unexpected error during data fetch:', err);
        showAlert('Ocurrió un error inesperado al intentar cargar los pacientes.');
    }
}

// Append a new row to the HTML table, now including the "Modificar" button
function insertRow(patient) {
    const listContainer = document.getElementById('patientsList');
    if (!listContainer) return;

    const row = document.createElement('tr');
    row.setAttribute('data-id', patient.id);

    row.innerHTML = `
        <td><strong>${patient.full_name}</strong></td>
        <td>${patient.dni}</td>
        <td>${patient.birth_date || '-'}</td>
        <td>${patient.email || '-'}</td>
        <td>${patient.phone || '-'}</td>
        <td>${patient.neighborhood || '-'}</td>
        <td>${patient.health_insurance || '-'}</td>
        <td>${patient.copayment || '-'}</td>
        <td>
            <button class="btn-modificar" onclick="loadPatientIntoForm(${patient.id})">Modificar</button>
            <button class="btn-eliminar" onclick="deletePatient(${patient.id})">Eliminar</button>
        </td>
    `;
    listContainer.appendChild(row);
}

// Perform a soft-delete (virtual delete) by setting is_active to false
async function deletePatient(id) {
    if (confirm("¿Estás seguro de que deseas eliminar este paciente?")) {
        try {
            // Virtual delete: Update status instead of removing the row
            const { error } = await supabaseClient
                .from('patients')
                .update({ is_active: false })
                .eq('id', id);

            if (error) {
                console.error('Error during virtual deletion:', error);
                showAlert(`No se pudo eliminar el registro: ${error.message}`);
            } else {
                // Remove row from UI
                const row = document.querySelector(`tr[data-id="${id}"]`);
                if (row) row.remove();

                // Remove from cache
                patientsDataMap.delete(id);

                // If user deleted the patient they were currently editing, reset form
                if (editingPatientId === id) {
                    resetFormState();
                }

                showAlert('Registro eliminado correctamente.', false);
            }
        } catch (err) {
            console.error('Unexpected error during virtual deletion:', err);
            showAlert('Fallo de conexión al intentar eliminar el registro.');
        }
    }
}

// ==========================================
// VERSION UPDATE POLLING SYSTEM
// ==========================================
const CURRENT_VERSION = 9; // ⚠️ Update this number to trigger the refresh banner
const VERSION_CODENAME = "Ninja"; // ⚠️ Creative code name

// Display the app version in the designated HTML element
function displayAppVersion() {
    const versionDisplay = document.getElementById('appVersionDisplay');
    if (versionDisplay) {
        versionDisplay.textContent = `Versión ${CURRENT_VERSION} - Cito${VERSION_CODENAME}`;
    }
}

// Fetch version.json and compare with CURRENT_VERSION
async function checkForUpdates() {
    try {
        const response = await fetch(`/version.json?t=${new Date().getTime()}`);
        const data = await response.json();

        if (data.version > CURRENT_VERSION) {
            const updateBanner = document.getElementById('updateBanner');
            if (updateBanner) {
                updateBanner.style.display = 'flex';
            }
        }
    } catch (error) {
        console.error('Failed to check for system updates:', error);
    }
}

// Schedule update checks
setInterval(checkForUpdates, 300000); // Check every 5 minutes
setTimeout(checkForUpdates, 5000);    // Initial check after 5 seconds