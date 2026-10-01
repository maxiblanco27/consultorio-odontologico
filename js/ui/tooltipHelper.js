/**
 * @file tooltipHelper.js
 * @description Manages interactive guidance tooltips for clinical history, treatments, and payments.
 * Handles click-to-toggle, close button, outside clicks, and keyboard accessibility.
 */

/**
 * Closes all currently opened guidance tooltips.
 */
export function closeAllTooltips() {
    document.querySelectorAll('.info-tooltip-wrapper.is-active').forEach((wrapper) => {
        wrapper.classList.remove('is-active');
        const btn = wrapper.querySelector('.info-tooltip-btn');
        if (btn) btn.setAttribute('aria-expanded', 'false');
    });
}

/**
 * Initializes tooltip interaction listeners across the application.
 */
export function initTooltips() {
    // Click delegation for toggle buttons and close buttons
    document.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('.info-tooltip-btn');
        const closeBtn = e.target.closest('.info-tooltip-close-btn');

        if (toggleBtn) {
            e.preventDefault();
            e.stopPropagation();
            const wrapper = toggleBtn.closest('.info-tooltip-wrapper');
            if (!wrapper) return;

            const isAlreadyActive = wrapper.classList.contains('is-active');
            closeAllTooltips();

            if (!isAlreadyActive) {
                wrapper.classList.add('is-active');
                toggleBtn.setAttribute('aria-expanded', 'true');
            }
            return;
        }

        if (closeBtn) {
            e.preventDefault();
            e.stopPropagation();
            const wrapper = closeBtn.closest('.info-tooltip-wrapper');
            if (wrapper) {
                wrapper.classList.remove('is-active');
                const btn = wrapper.querySelector('.info-tooltip-btn');
                if (btn) btn.setAttribute('aria-expanded', 'false');
            }
            return;
        }

        // Click outside any open tooltip
        if (!e.target.closest('.info-tooltip-content')) {
            closeAllTooltips();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllTooltips();
        }
    });
}
