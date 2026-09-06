/**
 * @file authView.js
 * @description UI component for handling login presentation, access control view toggle,
 * password visibility toggling, and user session badge in header.
 */

let onLoginCallback = null;
let onLogoutCallback = null;

/**
 * Initializes the authentication view elements, listeners, and handlers.
 * @param {Object} options - Configuration options.
 * @param {Function} options.onLogin - Async callback with (email, password).
 * @param {Function} options.onLogout - Async callback when logout is triggered.
 */
export function initAuthView({ onLogin, onLogout }) {
    onLoginCallback = onLogin;
    onLogoutCallback = onLogout;

    const loginForm = document.getElementById('loginForm');
    const togglePasswordBtn = document.getElementById('togglePasswordBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearLoginError();

            const email = document.getElementById('loginEmail')?.value.trim() || '';
            const password = document.getElementById('loginPassword')?.value || '';

            if (!email || !password) {
                showLoginError('Por favor ingrese su correo electrónico y contraseña.');
                return;
            }

            if (onLoginCallback) {
                await onLoginCallback(email, password);
            }
        });
    }

    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', () => {
            const passwordInput = document.getElementById('loginPassword');
            const icon = togglePasswordBtn.querySelector('i');
            if (!passwordInput) return;

            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                if (icon) {
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                }
            } else {
                passwordInput.type = 'password';
                if (icon) {
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (onLogoutCallback) {
                await onLogoutCallback();
            }
        });
    }
}

/**
 * Displays the login screen and hides the main application.
 */
export function showLoginView() {
    const authContainer = document.getElementById('authContainer');
    const appContainer = document.getElementById('appContainer');
    const userHeaderBadge = document.getElementById('userHeaderBadge');

    if (authContainer) authContainer.style.display = 'flex';
    if (appContainer) appContainer.style.display = 'none';
    if (userHeaderBadge) userHeaderBadge.style.display = 'none';

    // Clear password field for safety
    const passwordInput = document.getElementById('loginPassword');
    if (passwordInput) passwordInput.value = '';

    clearLoginError();
}

/**
 * Displays the main clinic application and reveals the user session badge.
 * @param {Object} user - Authenticated user details.
 */
export function showAppView(user) {
    const authContainer = document.getElementById('authContainer');
    const appContainer = document.getElementById('appContainer');
    const userHeaderBadge = document.getElementById('userHeaderBadge');
    const userEmailDisplay = document.getElementById('userEmailDisplay');

    if (authContainer) authContainer.style.display = 'none';
    if (appContainer) appContainer.style.display = 'block';

    if (userHeaderBadge) {
        userHeaderBadge.style.display = 'inline-flex';
    }

    if (userEmailDisplay && user) {
        userEmailDisplay.textContent = user.email || 'Usuario';
        userEmailDisplay.title = `Sesión activa: ${user.email}`;
    }
}

/**
 * Toggles the loading visual state on the login submit button.
 * @param {boolean} isLoading - True to display spinner and disable button.
 */
export function setLoginLoading(isLoading) {
    const submitBtn = document.getElementById('loginSubmitBtn');
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');

    if (submitBtn) {
        submitBtn.disabled = isLoading;
        if (isLoading) {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
        } else {
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
        }
    }

    if (emailInput) emailInput.disabled = isLoading;
    if (passwordInput) passwordInput.disabled = isLoading;
}

/**
 * Displays an error alert inside the login view.
 * @param {string} message - User-friendly error message.
 */
export function showLoginError(message) {
    const alertEl = document.getElementById('loginAlert');
    if (alertEl) {
        alertEl.textContent = message;
        alertEl.style.display = 'block';
    }
}

/**
 * Clears and hides the login error alert.
 */
export function clearLoginError() {
    const alertEl = document.getElementById('loginAlert');
    if (alertEl) {
        alertEl.textContent = '';
        alertEl.style.display = 'none';
    }
}
