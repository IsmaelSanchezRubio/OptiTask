// Importamos 'createClient' directamente desde el CDN de Supabase como un módulo
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

document.addEventListener('DOMContentLoaded', () => {
    // --- Configuración de Supabase ---
    const SUPABASE_URL = 'https://zccqcxssfrozmxousojf.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjY3FjeHNzZnJvem14b3Vzb2pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1OTAwODAsImV4cCI6MjA2ODE2NjA4MH0.F1xYE_VNnAuhYb-aR0ck05NcPHBJVUfhEHC73Lpa8Yo';
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    // ---------------------------------

    // --- Referencias a elementos del DOM de autenticación ---
    const authForm = document.getElementById('auth-form');
    const nameInput = document.getElementById('name-input'); // Nueva referencia
    const emailInput = document.getElementById('email-input');
    const passwordInput = document.getElementById('password-input');
    const signupButton = document.getElementById('signup-button');
    const loginButton = document.getElementById('login-button');
    const authMessage = document.getElementById('auth-message');

    /**
     * Registra un nuevo usuario con email, contraseña y nombre.
     */
    const handleSignup = async () => {
        authMessage.textContent = '';
        const name = nameInput.value.trim(); // Obtener el nombre
        const email = emailInput.value;
        const password = passwordInput.value;

        if (!name) {
            authMessage.textContent = 'Por favor, introduce tu nombre.';
            return;
        }

        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password
        });

        if (error) {
            authMessage.textContent = `Error al registrarse: ${error.message}`;
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
                console.error('Error al guardar el nombre en el perfil:', profileError.message);
                authMessage.textContent = `Registro exitoso, pero hubo un error al guardar tu nombre: ${profileError.message}`;
                // Opcional: podrías considerar eliminar el usuario recién creado si el perfil no se pudo guardar.
                // await supabase.auth.admin.deleteUser(userId); // ¡Cuidado! Esto requiere una clave de servicio en el backend.
            } else {
                console.log('Nombre de usuario guardado en el perfil.');
            }

            // Si la confirmación por email está desactivada, redirige directamente
            if (data.session) {
                authMessage.textContent = `Registro exitoso y sesión iniciada para ${data.user.email}. Redirigiendo...`;
                console.log('Usuario registrado y logueado:', data.user);
                window.location.href = 'index.html'; // Redirige a la página de tareas (que es index.html)
            } else {
                authMessage.textContent = '¡Registro exitoso! Por favor, revisa tu correo para confirmar tu cuenta.';
                console.log('Registro exitoso, se requiere confirmación por email.');
            }
        }
    };

    /**
     * Inicia sesión con email y contraseña.
     */
    const handleLogin = async () => {
        authMessage.textContent = '';
        const email = emailInput.value;
        const password = passwordInput.value;

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            authMessage.textContent = `Error al iniciar sesión: ${error.message}`;
            console.error('Error de inicio de sesión:', error.message);
        } else if (data.user) {
            authMessage.textContent = `Sesión iniciada para ${data.user.email}. Redirigiendo...`;
            console.log('Usuario logueado:', data.user);
            window.location.href = 'index.html'; // Redirige a la página de tareas (que es index.html)
        }
    };

    // --- Event Listeners de autenticación ---
    authForm.addEventListener('submit', (e) => e.preventDefault()); // Evita envío por defecto del formulario
    signupButton.addEventListener('click', handleSignup);
    loginButton.addEventListener('click', handleLogin);

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