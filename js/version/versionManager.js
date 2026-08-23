/**
 * @file versionManager.js
 * @description Manages application version display and update polling.
 */

export const CURRENT_VERSION = 16;
export const VERSION_CODENAME = 'Zenith';

/**
 * Initializes the version display and update polling schedule.
 */
export function initVersionManager() {
    displayAppVersion();

    // Schedule update checks
    setInterval(checkForUpdates, 300000); // Check every 5 minutes
    setTimeout(checkForUpdates, 5000);    // Initial check after 5 seconds
}

/**
 * Displays the current app version in the designated UI element.
 */
function displayAppVersion() {
    const versionDisplay = document.getElementById('appVersionDisplay');
    if (versionDisplay) {
        versionDisplay.textContent = `Versión ${CURRENT_VERSION} - Cito${VERSION_CODENAME}`;
    }
}

/**
 * Fetches version.json and displays update banner if a newer version is available.
 */
async function checkForUpdates() {
    try {
        const response = await fetch(`/version.json?t=${Date.now()}`);
        if (!response.ok) return;

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
