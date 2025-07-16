// Importamos 'createClient' directamente desde el CDN de Supabase como un módulo
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

document.addEventListener('DOMContentLoaded', () => {
    // --- Configuración de Supabase ---
    const SUPABASE_URL = 'https://zccqcxssfrozmxousojf.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjY3FjeHNzZnJvem14b3Vzb2pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1OTAwODAsImV4cCI6MjA2ODE2NjA4MH0.F1xYE_VNnAuhYb-aR0ck05NcPHBJVUfhEHC73Lpa8Yo';
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    // ---------------------------------

    // --- Referencias a elementos del DOM de registro ---
    const signupForm = document.getElementById('signup-form');
    const nameInput = document.getElementById('name-input');
    const emailInput = document.getElementById('email-input');
    const passwordInput = document.getElementById('password-input');
    const signupButton = document.getElementById('signup-button');
    const signupMessage = document.getElementById('signup-message');

    /**
     * Registra un nuevo usuario con email, contraseña y nombre.
     */
    const handleSignup = async (event) => {
        // Evita el envío por defecto del formulario
        event.preventDefault();

        // Limpia cualquier mensaje anterior
        signupMessage.textContent = '';

        const name = nameInput.value.trim(); // Obtener el nombre y eliminar espacios en blanco
        const email = emailInput.value;
        const password = passwordInput.value;

        // Validación básica para el nombre
        if (!name) {
            signupMessage.textContent = 'Por favor, introduce tu nombre.';
            return;
        }
        // Validación básica para el email
        if (!email) {
            signupMessage.textContent = 'Por favor, introduce tu correo electrónico.';
            return;
        }
        // Validación básica para la contraseña
        if (!password) {
            signupMessage.textContent = 'Por favor, introduce una contraseña.';
            return;
        }
        if (password.length < 6) {
            signupMessage.textContent = 'La contraseña debe tener al menos 6 caracteres.';
            return;
        }

        // Realiza el registro del usuario con Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password
        });

        if (error) {
            // Muestra un mensaje de error si el registro falla
            signupMessage.textContent = `Error al registrarse: ${error.message}`;
            console.error('Error de registro:', error.message);
        } else if (data.user) {
            // Si el registro fue exitoso, intentar guardar el nombre en la tabla 'profiles'
            const userId = data.user.id;
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([
                    { user_id: userId, name: name }
                ]);

            if (profileError) {
                // Si hay un error al guardar el perfil, se registra y se informa al usuario
                console.error('Error al guardar el nombre en el perfil:', profileError.message);
                signupMessage.textContent = `Registro exitoso, pero hubo un error al guardar tu nombre: ${profileError.message}`;
                // Opcional: podrías considerar acciones adicionales aquí si el perfil es crítico.
            } else {
                console.log('Nombre de usuario guardado en el perfil.');
            }

            // Comprueba si se inició la sesión automáticamente (si la confirmación por email está desactivada)
            if (data.session) {
                signupMessage.textContent = `Registro exitoso y sesión iniciada para ${data.user.email}. Redirigiendo...`;
                console.log('Usuario registrado y logueado:', data.user);
                // Redirige a la página principal de tareas
                window.location.href = 'index.html';
            } else {
                // Si se requiere confirmación por email, muestra el mensaje correspondiente
                signupMessage.textContent = '¡Registro exitoso! Por favor, revisa tu correo para confirmar tu cuenta.';
                console.log('Registro exitoso, se requiere confirmación por email.');
            }
        }
    };

    // Agrega el event listener al formulario para el evento 'submit'
    signupForm.addEventListener('submit', handleSignup);

    // --- Lógica inicial de verificación de sesión ---
    // Si ya hay una sesión activa, redirige directamente a index.html
    const checkSessionAndRedirect = async () => {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session && !error) {
            console.log('Sesión activa encontrada, redirigiendo a tareas...');
            window.location.href = 'index.html';
        } else if (error) {
            console.error('Error al obtener la sesión inicial:', error.message);
        }
    };
    checkSessionAndRedirect(); // Ejecuta al cargar la página
});