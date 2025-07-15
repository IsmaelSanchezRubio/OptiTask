// Importamos 'createClient' directamente desde el CDN de Supabase como un módulo
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

document.addEventListener('DOMContentLoaded', () => {
    // --- Configuración de Supabase ---
    const SUPABASE_URL = 'https://zccqcxssfrozmxousojf.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjY3FjeHNzZnJvem14b3Vzb2pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1OTAwODAsImV4cCI6MjA2ODE2NjA4MH0.F1xYE_VNnAuhYb-aR0ck05NcPHBJVUfhEHC73Lpa8Yo';
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    // ---------------------------------

    // --- Referencias a elementos del DOM de la aplicación de tareas ---
    const userEmailSpan = document.getElementById('user-email');
    const signoutButton = document.getElementById('signout-button');
    const addTaskRedirectButton = document.getElementById('add-task-redirect-button'); // Botón de redirección a tarea.html
    const taskList = document.getElementById('task-list');

    // Referencias para los botones de filtro de vista
    const showPendingButton = document.getElementById('show-pending');
    const showCompletedButton = document.getElementById('show-completed');

    let tasks = []; // Array local para cachear las tareas del usuario actual
    let currentView = 'pending'; // Estado para saber qué vista está activa: 'pending' o 'completed'

    /**
     * Protege la ruta: redirige a auth.html si no hay sesión activa.
     * Muestra nombre del usuario si hay sesión.
     */
    const protectRouteAndDisplayUser = async () => {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!session || error) {
            console.log('No hay sesión activa o error. Redirigiendo a autenticación...');
            window.location.href = 'auth.html'; // Redirige si no hay sesión
            return;
        }

        // Obtener y mostrar el nombre del usuario
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

        loadTasks(); // Carga todas las tareas inicialmente
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
     * Carga TODAS las tareas desde Supabase para el usuario autenticado.
     * La lógica de filtrado por vista se hará en renderTasks.
     */
    const loadTasks = async () => {
        console.log('Cargando todas las tareas del usuario desde Supabase...');
        const { data, error } = await supabase
            .from('tasks')
            .select('*') // Selecciona todas las columnas, incluyendo 'description'
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error al cargar las tareas:', error.message);
            return;
        }

        tasks = data;
        console.log('Todas las tareas cargadas:', tasks);
        renderTasks(); // Renderiza las tareas según la vista actual
    };

    /**
     * Renderiza (dibuja) las tareas en el DOM, filtrando por la vista actual.
     */
    const renderTasks = () => {
        taskList.innerHTML = ''; // Limpia la lista actual

        // Filtra las tareas según la vista actual ('pending' o 'completed')
        const filteredTasks = tasks.filter(task => {
            if (currentView === 'pending') {
                return !task.is_complete;
            } else if (currentView === 'completed') {
                return task.is_complete;
            }
            return true;
        });

        if (filteredTasks.length === 0) {
            const messageLi = document.createElement('li');
            messageLi.textContent = currentView === 'pending' ? 'No hay tareas pendientes.' : 'No hay tareas completadas.';
            messageLi.style.justifyContent = 'center';
            messageLi.style.color = 'var(--color-text-muted)';
            messageLi.style.fontStyle = 'italic';
            taskList.appendChild(messageLi);
            return;
        }

        filteredTasks.forEach((task) => {
            const li = document.createElement('li');
            if (task.is_complete) {
                li.classList.add('completed');
            }

            // --- Contenedor principal de la tarea para manejar el click de completado ---
            const taskDisplayArea = document.createElement('div');
            taskDisplayArea.style.display = 'flex'; // Para alinear el check y el contenido
            taskDisplayArea.style.alignItems = 'center';
            taskDisplayArea.style.flexGrow = '1';
            taskDisplayArea.style.cursor = 'pointer'; // Indica que es clicable
            taskDisplayArea.addEventListener('click', () => toggleComplete(task.id));


            // --- Icono de Check (anteriormente task-content) ---
            const checkToggleDiv = document.createElement('div');
            checkToggleDiv.classList.add('task-check-toggle');
            const checkIcon = document.createElement('i');
            checkIcon.classList.add('fas');
            checkIcon.classList.add(task.is_complete ? 'fa-circle-check' : 'fa-circle');
            checkToggleDiv.appendChild(checkIcon);
            
            // --- Contenido de la tarea (título y descripción) ---
            const taskContentDiv = document.createElement('div');
            taskContentDiv.classList.add('task-content'); // Mantiene la clase para estilos

            const taskTitleSpan = document.createElement('span');
            taskTitleSpan.classList.add('task-title'); // Clase para estilos del título
            taskTitleSpan.textContent = task.title;

            const taskDescriptionSpan = document.createElement('span');
            taskDescriptionSpan.classList.add('task-description'); // Clase para estilos de la descripción
            taskDescriptionSpan.textContent = task.description || ''; // Mostrar descripción, o vacío si es null

            taskContentDiv.appendChild(taskTitleSpan);
            if (task.description) { // Solo añadir la descripción si existe
                taskContentDiv.appendChild(taskDescriptionSpan);
            }
            
            taskDisplayArea.appendChild(checkToggleDiv);
            taskDisplayArea.appendChild(taskContentDiv);
            li.appendChild(taskDisplayArea); // Añadir el área de visualización clicable a la LI


            // --- Contenedor para los botones de acción (Editar y Eliminar) ---
            const actionButtonsDiv = document.createElement('div');
            actionButtonsDiv.classList.add('task-actions');

            const editButton = document.createElement('button');
            editButton.textContent = 'Editar';
            editButton.classList.add('edit-button');
            editButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Evita que se dispare el toggleComplete del padre
                window.location.href = `tarea.html?id=${task.id}`; // Redirige a tarea.html con el ID
            });

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Eliminar';
            deleteButton.classList.add('delete-button'); // Añadir clase para estilos específicos si es necesario
            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Evita que se dispare el toggleComplete del padre
                deleteTask(task.id);
            });

            actionButtonsDiv.appendChild(editButton);
            actionButtonsDiv.appendChild(deleteButton);
            li.appendChild(actionButtonsDiv);
            
            taskList.appendChild(li);
        });
    };

    /**
     * Alterna el estado 'is_complete' de una tarea en Supabase.
     * @param {string} taskId El ID de la tarea.
     */
    const toggleComplete = async (taskId) => {
        const taskToUpdate = tasks.find(task => task.id === taskId);
        if (!taskToUpdate) {
            console.error('Tarea no encontrada para actualizar:', taskId);
            return;
        }

        const { error } = await supabase
            .from('tasks')
            .update({ is_complete: !taskToUpdate.is_complete })
            .eq('id', taskId);

        if (error) {
            console.error('Error al actualizar la tarea:', error.message);
            return;
        }
        console.log(`Tarea ${taskId} marcada como ${!taskToUpdate.is_complete}`);
        await loadTasks();
    };

    /**
     * Elimina una tarea de Supabase.
     * @param {string} taskId El ID de la tarea.
     */
    const deleteTask = async (taskId) => {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId);

        if (error) {
            console.error('Error al eliminar la tarea:', error.message);
            return;
        }
        console.log('Tarea eliminada:', taskId);
        await loadTasks();
    };

    /**
     * Cambia la vista actual (pendientes/completadas) y actualiza la UI de los botones.
     * @param {string} view 'pending' o 'completed'
     */
    const changeView = (view) => {
        currentView = view;
        showPendingButton.classList.remove('active');
        showCompletedButton.classList.remove('active');
        if (view === 'pending') {
            showPendingButton.classList.add('active');
        } else {
            showCompletedButton.classList.add('active');
        }
        renderTasks();
    };

    // --- Event Listeners ---

    signoutButton.addEventListener('click', handleSignout);

    // Redirige a tarea.html para agregar una nueva tarea
    addTaskRedirectButton.addEventListener('click', (e) => {
        e.preventDefault(); // Evita el envío del formulario
        window.location.href = 'tarea.html';
    });

    showPendingButton.addEventListener('click', () => changeView('pending'));
    showCompletedButton.addEventListener('click', () => changeView('completed'));

    // --- Inicio de la aplicación de tareas ---
    protectRouteAndDisplayUser();
});