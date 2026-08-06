const SUPABASE_URL = 'https://alsurmvechfporxbzaed.supabase.co';
const SUPABASE_KEY = 'sb_publishable_OTdYnJp9o9QXC6MxhVII7w_0SShMN1n';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Función utilitaria para notificar al usuario en pantalla
function mostrarAlerta(mensaje, esError = true) {
    const contenedor = document.getElementById('mensajeAlerta');
    if (!contenedor) return;

    contenedor.textContent = mensaje;
    contenedor.style.display = 'block';
    
    if (esError) {
        contenedor.style.backgroundColor = '#f8d7da';
        contenedor.style.color = '#721c24';
        contenedor.style.border = '1px solid #f5c6cb';
    } else {
        contenedor.style.backgroundColor = '#d4edda';
        contenedor.style.color = '#155724';
        contenedor.style.border = '1px solid #c3e6cb';
    }

    // Ocultar automáticamente tras 6 segundos
    setTimeout(() => {
        contenedor.style.display = 'none';
    }, 6000);
}

document.addEventListener('DOMContentLoaded', async () => {
    loadPatients();
});

async function loadPatients() {
    const listContainer = document.getElementById('listaPacientes');
    listContainer.innerHTML = ''; 

    try {
        const { data: patients, error } = await supabase
            .from('patients')
            .select('*')
            .order('id', { ascending: false });

        if (error) {
            console.error('Error fetching patients:', error);
            mostrarAlerta(`No se pudo conectar a la base de datos: ${error.message || 'Verifique su conexión o credenciales.'}`);
            return;
        }

        patients.forEach(patient => insertRow(patient));
    } catch (err) {
        console.error('Unexpected error:', err);
        mostrarAlerta('Ocurrió un error inesperado al intentar cargar los pacientes.');
    }
}

document.getElementById('formPaciente').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btnGuardar = document.getElementById('btnGuardar');

    const newPatient = {
        full_name: document.getElementById('nombre').value,
        dni: document.getElementById('dni').value,
        birth_date: document.getElementById('fechaNacimiento').value,
        phone: document.getElementById('telefono').value,
        neighborhood: document.getElementById('barrio').value,
        health_insurance: document.getElementById('obraSocial').value,
        treatment: document.getElementById('tratamiento').value
    };

    try {
        btnGuardar.disabled = true;
        btnGuardar.textContent = 'Guardando...';

        const { data, error } = await supabase
            .from('patients')
            .insert([newPatient])
            .select();

        if (error) {
            console.error('Error inserting patient:', error);
            mostrarAlerta(`Error al guardar el paciente: ${error.message}`);
        } else {
            insertRow(data[0]);
            this.reset();
            mostrarAlerta('Paciente guardado exitosamente.', false);
        }
    } catch (err) {
        console.error('Unexpected error:', err);
        mostrarAlerta('No se pudo completar la operación por un fallo de conexión.');
    } finally {
        btnGuardar.disabled = false;
        btnGuardar.textContent = 'Guardar en el Historial';
    }
});

function insertRow(patient) {
    const listContainer = document.getElementById('listaPacientes');
    const row = document.createElement('tr');
    row.setAttribute('data-id', patient.id);
    
    row.innerHTML = `
        <td><strong>${patient.full_name}</strong></td>
        <td>${patient.dni}</td>
        <td>${patient.birth_date || '-'}</td>
        <td>${patient.phone || '-'}</td>
        <td>${patient.neighborhood || '-'}</td>
        <td>${patient.health_insurance || '-'}</td>
        <td>${patient.treatment || '-'}</td>
        <td><button class="btn-eliminar" onclick="deletePatient(${patient.id})">Eliminar</button></td>
    `;
    listContainer.appendChild(row);
}

async function deletePatient(id) {
    if (confirm("¿Eliminar este registro permanentemente?")) {
        try {
            const { error } = await supabase
                .from('patients')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting patient:', error);
                mostrarAlerta(`No se pudo eliminar el registro: ${error.message}`);
            } else {
                const row = document.querySelector(`tr[data-id="${id}"]`);
                if (row) row.remove();
                mostrarAlerta('Registro eliminado correctamente.', false);
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            mostrarAlerta('Fallo de conexión al intentar eliminar el registro.');
        }
    }
}

document.getElementById('buscador').addEventListener('keyup', function() {
    const filter = this.value.toLowerCase();
    const rows = document.querySelectorAll('#listaPacientes tr');
    rows.forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(filter) ? "" : "none";
    });
});
