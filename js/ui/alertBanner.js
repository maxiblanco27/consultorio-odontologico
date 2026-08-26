/**
 * @file alertBanner.js
 * @description UI module for managing toast notifications and environment banners.
 */

import { PROD_HOSTNAME } from '../config/supabaseClient.js';

let mainAlertTimer = null;
let modalAlertTimer = null;
let paymentModalAlertTimer = null;

/**
 * Displays a feedback alert in the main application container.
 * @param {string} message - Notification text to display.
 * @param {boolean} [isError=true] - Whether the notification represents an error.
 * @param {number} [duration=6000] - Duration in milliseconds before automatic dismissal.
 */
export function showAlert(message, isError = true, duration = 6000) {
    const alertContainer = document.getElementById('alertMessage');
    if (!alertContainer) return;

    if (mainAlertTimer) {
        clearTimeout(mainAlertTimer);
    }

    alertContainer.textContent = message;
    alertContainer.className = `alert-banner ${isError ? 'alert-error' : 'alert-success'}`;
    alertContainer.style.display = 'block';

    mainAlertTimer = setTimeout(() => {
        alertContainer.style.display = 'none';
        mainAlertTimer = null;
    }, duration);
}

/**
 * Displays a feedback alert inside the clinical history modal.
 * @param {string} message - Notification text to display.
 * @param {boolean} [isError=true] - Whether the notification represents an error.
 * @param {number} [duration=5000] - Duration in milliseconds before automatic dismissal.
 */
export function showModalAlert(message, isError = true, duration = 5000) {
    const alertContainer = document.getElementById('modalAlertMessage');
    if (!alertContainer) return;

    if (modalAlertTimer) {
        clearTimeout(modalAlertTimer);
    }

    alertContainer.textContent = message;
    alertContainer.className = `alert-banner ${isError ? 'alert-error' : 'alert-success'}`;
    alertContainer.style.display = 'block';

    modalAlertTimer = setTimeout(() => {
        alertContainer.style.display = 'none';
        modalAlertTimer = null;
    }, duration);
}

/**
 * Displays a feedback alert inside the payments modal.
 * @param {string} message - Notification text to display.
 * @param {boolean} [isError=true] - Whether the notification represents an error.
 * @param {number} [duration=5000] - Duration in milliseconds before automatic dismissal.
 */
export function showPaymentModalAlert(message, isError = true, duration = 5000) {
    const alertContainer = document.getElementById('paymentModalAlertMessage');
    if (!alertContainer) return;

    if (paymentModalAlertTimer) {
        clearTimeout(paymentModalAlertTimer);
    }

    alertContainer.textContent = message;
    alertContainer.className = `alert-banner ${isError ? 'alert-error' : 'alert-success'}`;
    alertContainer.style.display = 'block';

    paymentModalAlertTimer = setTimeout(() => {
        alertContainer.style.display = 'none';
        paymentModalAlertTimer = null;
    }, duration);
}

/**
 * Injects a warning banner if the application is running outside the production environment.
 */
export function initEnvironmentBanner() {
    if (window.location.hostname !== PROD_HOSTNAME) {
        const banner = document.createElement('div');
        banner.className = 'test-environment-banner';
        banner.innerHTML = `
            <span>Atención: Ud. está en una versión de prueba.</span>
            <a href="https://${PROD_HOSTNAME}" class="test-banner-link">
                Para acceder al sistema real haga click aquí
            </a>
        `;
        document.body.insertBefore(banner, document.body.firstChild);
    }
}
