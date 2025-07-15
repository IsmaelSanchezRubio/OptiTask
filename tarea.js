// Importamos 'createClient' directamente desde el CDN de Supabase como un módulo
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

document.addEventListener('DOMContentLoaded', () => {
    // --- Configuración de Supabase ---
    const SUPABASE_URL = 'https://zccqcxssfrozmxousojf.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjY3FjeHNzZnJvem14b3Vzb2pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1OTAwODAsImV4cCI6MjA2ODE2NjA4MH0.F1xYE_VNnAuhYb-aR0ck05NcPHBJVUfhEHC73Lpa8Yo';
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    // ---------------------------------

    // --- Referencias a elementos del DOM ---
    const userEmailSpan = document.getElementById('user-email');
    const signoutButton = document.getElementById('signout-button');
    const taskForm = document.getElementById('task-form');
    const taskTitleInput = document.getElementById('task-title-input');
    const taskDescriptionInput = document.getElementById('task-description-input');
    const saveTaskButton = document.getElementById('save-task-button');
    const cancelButton = document.getElementById('cancel-button');
    const taskMessage = document.getElementById('task-message');

    let taskId = null; // Variable para almacenar el ID de la tarea si estamos editando

    /**
     * Protege la ruta: redirige a auth.html si no hay sesión activa.
     * Muestra el email y el nombre del usuario si hay sesión.
     * También carga los datos de la tarea si se está editando.
     */
    const protectRouteAndDisplayUser = async () => {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!session || error) {
            console.log('No hay sesión activa o error. Redirigiendo a autenticación...');
            window.location.href = 'auth.html'; // Redirige si no hay sesión
            return;
        }

        // Si hay sesión, muestra el email del usuario
        // userEmailSpan.textContent = session.user.email; // Original

        // Obtener y mostrar el nombre del usuario (similar a index.js)
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('name')
            .eq('user_id', session.user.id)
            .single();

        if (profileError) {
            console.error('Error al cargar el perfil del usuario:', profileError.message);
            userEmailSpan.textContent = `${session.user.email}`;
        } else if (profileData && profileData.name) {
            userEmailSpan.textContent = `${profileData.name} `;
        } else {
            userEmailSpan.textContent = `${session.user.email}`;
        }


        // Verificar si hay un ID de tarea en la URL (modo edición)
        const urlParams = new URLSearchParams(window.location.search);
        const idFromUrl = urlParams.get('id');
        
        if (idFromUrl) {
            taskId = idFromUrl;
            console.log('Modo edición. Cargando tarea con ID:', taskId);
            await loadTaskForEditing(taskId);
        } else {
            console.log('Modo añadir nueva tarea.');
        }
    };

    /**
     * Cierra la sesión del usuario actual y redirige a auth.html.
     */
    const handleSignout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error al cerrar sesión:', error.message);
        } else {
            console.log('Sesión cerrada. Redirigiendo...');
            window.location.href = 'auth.html'; // Redirige al cerrar sesión
        }
    };

    /**
     * Carga los detalles de una tarea específica para edición.
     * @param {string} id El ID de la tarea a cargar.
     */
    const loadTaskForEditing = async (id) => {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', id)
            .single(); // Esperamos un solo resultado

        if (error) {
            taskMessage.textContent = `Error al cargar la tarea: ${error.message}`;
            console.error('Error al cargar tarea para edición:', error.message);
            return;
        }

        if (data) {
            taskTitleInput.value = data.title;
            taskDescriptionInput.value = data.description || ''; // Asegurarse de que no sea null
            saveTaskButton.textContent = 'Actualizar Tarea'; // Cambiar texto del botón
        } else {
            taskMessage.textContent = 'Tarea no encontrada.';
            console.warn('Tarea no encontrada para el ID:', id);
        }
    };

    /**
     * Guarda (añade o actualiza) una tarea en Supabase.
     */
    const saveTask = async () => {
        taskMessage.textContent = '';
        const title = taskTitleInput.value.trim();
        const description = taskDescriptionInput.value.trim();

        if (!title) {
            taskMessage.textContent = 'El título de la tarea no puede estar vacío.';
            return;
        }

        if (taskId) { // Modo edición: Actualizar tarea existente
            const { error } = await supabase
                .from('tasks')
                .update({ title: title, description: description })
                .eq('id', taskId);

            if (error) {
                taskMessage.textContent = `Error al actualizar la tarea: ${error.message}`;
                console.error('Error al actualizar tarea:', error.message);
            } else {
                console.log('Tarea actualizada con éxito.');
                window.location.href = 'index.html'; // Volver a la lista de tareas
            }
        } else { // Modo añadir: Insertar nueva tarea
            const { data, error } = await supabase
                .from('tasks')
                .insert([
                    { title: title, description: description, is_complete: false }
                ])
                .select();

            if (error) {
                taskMessage.textContent = `Error al añadir la tarea: ${error.message}`;
                console.error('Error al añadir tarea:', error.message);
            } else {
                console.log('Tarea añadida con éxito:', data);
                window.location.href = 'index.html'; // Volver a la lista de tareas
            }
        }
    };

    // --- Event Listeners ---
    signoutButton.addEventListener('click', handleSignout);
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveTask();
    });
    cancelButton.addEventListener('click', () => {
        window.location.href = 'index.html'; // Volver a la lista de tareas sin guardar
    });

    // --- Inicio de la lógica de la página ---
    protectRouteAndDisplayUser();
});