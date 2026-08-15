const SUPABASE_URL = 'https://alsurmvechfporxbzaed.supabase.co';
const SUPABASE_KEY = 'sb_publishable_OTdYnJp9o9QXC6MxhVII7w_0SShMN1n';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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
        patientForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const saveBtn = document.getElementById('saveBtn');

            const newPatient = {
                full_name: document.getElementById('fullName').value,
                dni: document.getElementById('dni').value,
                birth_date: document.getElementById('birthDate').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                neighborhood: document.getElementById('neighborhood').value,
                health_insurance: document.getElementById('healthInsurance').value,
                treatment: document.getElementById('treatment').value
            };

            try {
                // Disable button during submission to prevent duplicates
                saveBtn.disabled = true;
                saveBtn.textContent = 'Guardando...';

                const { data, error } = await supabaseClient
                    .from('patients')
                    .insert([newPatient])
                    .select();

                if (error) {
                    console.error('Error inserting patient:', error);
                    showAlert(`Error al guardar el paciente: ${error.message}`);
                } else {
                    insertRow(data[0]);
                    this.reset();
                    showAlert('Paciente guardado exitosamente.', false);
                }
            } catch (err) {
                console.error('Unexpected error during insertion:', err);
                showAlert('No se pudo completar la operación por un fallo de conexión.');
            } finally {
                // Restore button state
                saveBtn.disabled = false;
                saveBtn.textContent = 'Guardar en el Historial';
            }
        });
    } else {
        console.error("DOM Error: 'patientForm' element not found in HTML.");
    }

    // 3. Listen for search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            const filter = this.value.toLowerCase();
            const rows = document.querySelectorAll('#patientsList tr');
            rows.forEach(row => {
                row.style.display = row.innerText.toLowerCase().includes(filter) ? "" : "none";
            });
        });
    }
});

// Fetch patients from Supabase and render them
async function loadPatients() {
    const listContainer = document.getElementById('patientsList');
    
    if (!listContainer) {
        console.error("DOM Error: 'patientsList' table not found in HTML.");
        return;
    }

    listContainer.innerHTML = ''; 

    try {
        const { data: patients, error } = await supabaseClient
            .from('patients')
            .select('*')
            .order('id', { ascending: false });

        if (error) {
            console.error('Error fetching patients:', error);
            showAlert(`No se pudo conectar a la base de datos: ${error.message || 'Verifique su conexión o credenciales.'}`);
            return;
        }

        patients.forEach(patient => insertRow(patient));
    } catch (err) {
        console.error('Unexpected error during data fetch:', err);
        showAlert('Ocurrió un error inesperado al intentar cargar los pacientes.');
    }
}

// Append a new row to the HTML table
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
        <td>${patient.treatment || '-'}</td>
        <td><button class="btn-eliminar" onclick="deletePatient(${patient.id})">Eliminar</button></td>
    `;
    listContainer.appendChild(row);
}

// Delete a patient record from Supabase and remove row from DOM
async function deletePatient(id) {
    if (confirm("¿Eliminar este registro permanentemente?")) {
        try {
            const { error } = await supabaseClient
                .from('patients')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting patient:', error);
                showAlert(`No se pudo eliminar el registro: ${error.message}`);
            } else {
                const row = document.querySelector(`tr[data-id="${id}"]`);
                if (row) row.remove();
                showAlert('Registro eliminado correctamente.', false);
            }
        } catch (err) {
            console.error('Unexpected error during deletion:', err);
            showAlert('Fallo de conexión al intentar eliminar el registro.');
        }
    }
}

// ==========================================
// VERSION UPDATE POLLING SYSTEM
// ==========================================
const CURRENT_VERSION = 4;
const VERSION_CODENAME = "Pendejo"; // ⚠️ Only the creative word, "Cito" is already fixed below

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