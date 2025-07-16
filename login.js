// Importamos 'createClient' directamente desde el CDN de Supabase como un módulo
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

document.addEventListener('DOMContentLoaded', () => {
    // --- Configuración de Supabase ---
    const SUPABASE_URL = 'https://zccqcxssfrozmxousojf.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjY3FjeHNzZnJvem14b3Vzb2pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1OTAwODAsImV4cCI6MjA2ODE2NjA4MH0.F1xYE_VNnAuhYb-aR0ck05NcPHBJVUfhEHC73Lpa8Yo';
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    // ---------------------------------

    // --- Referencias a elementos del DOM de inicio de sesión ---
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email-input');
    const passwordInput = document.getElementById('password-input');
    const loginButton = document.getElementById('login-button');
    const loginMessage = document.getElementById('login-message');

    /**
     * Inicia sesión con email y contraseña.
     */
    const handleLogin = async (event) => {
        // Evita el envío por defecto del formulario
        event.preventDefault();

        // Limpia cualquier mensaje anterior
        loginMessage.textContent = '';

        const email = emailInput.value;
        const password = passwordInput.value;

        // Validación básica para el email
        if (!email) {
            loginMessage.textContent = 'Por favor, introduce tu correo electrónico.';
            return;
        }
        // Validación básica para la contraseña
        if (!password) {
            loginMessage.textContent = 'Por favor, introduce tu contraseña.';
            return;
        }

        // Realiza el inicio de sesión con Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            // Muestra un mensaje de error si el inicio de sesión falla
            loginMessage.textContent = `Error al iniciar sesión: ${error.message}`;
            console.error('Error de inicio de sesión:', error.message);
        } else if (data.user) {
            // Si el inicio de sesión fue exitoso, muestra un mensaje y redirige
            loginMessage.textContent = `Sesión iniciada para ${data.user.email}. Redirigiendo...`;
            console.log('Usuario logueado:', data.user);
            // Redirige a la página principal de tareas
            window.location.href = 'index.html';
        }
    };

    // Agrega el event listener al formulario para el evento 'submit'
    loginForm.addEventListener('submit', handleLogin);

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