/**
 * @file tooltipHelper.js
 * @description Manages interactive guidance and assistant tooltips for clinical history, treatments, and payments.
 * Handles click-to-toggle, close/dismiss buttons, outside clicks, keyboard accessibility, and automated assistant deployment.
 */

let activeFormFocusCleanup = null;

/**
 * Closes all currently opened guidance and assistant tooltips.
 */
export function closeAllTooltips() {
    if (typeof activeFormFocusCleanup === 'function') {
        activeFormFocusCleanup();
        activeFormFocusCleanup = null;
    }

    document.querySelectorAll('.info-tooltip-wrapper.is-active').forEach((wrapper) => {
        wrapper.classList.remove('is-active');
        const btn = wrapper.querySelector('.info-tooltip-btn');
        if (btn) btn.setAttribute('aria-expanded', 'false');
    });
}

/**
 * Opens a specific assistant tooltip automatically with smooth animation.
 * @param {string|HTMLElement} target - Selector or HTMLElement of the tooltip wrapper.
 * @param {Object} [options]
 * @param {number} [options.delay=320] - Delay in milliseconds before expanding (for smooth modal entrance).
 * @param {string} [options.autoCloseFormId] - Form ID where focusing inputs will auto-dismiss the assistant.
 */
export function openAssistantTooltip(target, options = {}) {
    const { delay = 320, autoCloseFormId = null } = options;

    setTimeout(() => {
        const wrapper = typeof target === 'string' ? document.querySelector(target) : target;
        if (!wrapper) return;

        // If the modal containing this tooltip is closed or hidden, do not open
        const parentModal = wrapper.closest('.modal-overlay');
        if (parentModal && (parentModal.style.display === 'none' || getComputedStyle(parentModal).display === 'none')) {
            return;
        }

        closeAllTooltips();
        wrapper.classList.add('is-active');
        const btn = wrapper.querySelector('.info-tooltip-btn');
        if (btn) btn.setAttribute('aria-expanded', 'true');

        const content = wrapper.querySelector('.info-tooltip-content');
        if (content) {
            content.classList.remove('assistant-glow');
            // Trigger browser reflow to restart keyframe animation
            void content.offsetWidth;
            content.classList.add('assistant-glow');
        }

        // Auto-close when the user starts typing or focusing inputs inside the specified form
        if (autoCloseFormId) {
            const form = document.getElementById(autoCloseFormId);
            if (form) {
                const onFormFocus = (e) => {
                    const tag = e.target?.tagName;
                    if (tag && ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) {
                        if (!e.target.closest('.info-tooltip-wrapper')) {
                            wrapper.classList.remove('is-active');
                            if (btn) btn.setAttribute('aria-expanded', 'false');
                            form.removeEventListener('focusin', onFormFocus);
                            activeFormFocusCleanup = null;
                        }
                    }
                };
                form.addEventListener('focusin', onFormFocus);
                activeFormFocusCleanup = () => form.removeEventListener('focusin', onFormFocus);
            }
        }
    }, delay);
}

/**
 * Initializes tooltip interaction listeners across the application.
 */
export function initTooltips() {
    // Click delegation for toggle buttons, close buttons, and dismiss buttons
    document.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('.info-tooltip-btn');
        const closeBtn = e.target.closest('.info-tooltip-close-btn');
        const dismissBtn = e.target.closest('.btn-tooltip-dismiss');

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

        if (closeBtn || dismissBtn) {
            e.preventDefault();
            e.stopPropagation();
            const actionBtn = closeBtn || dismissBtn;
            const wrapper = actionBtn.closest('.info-tooltip-wrapper');
            if (wrapper) {
                wrapper.classList.remove('is-active');
                const btn = wrapper.querySelector('.info-tooltip-btn');
                if (btn) btn.setAttribute('aria-expanded', 'false');

                // If dismiss button has a target input to focus, focus it
                if (dismissBtn && dismissBtn.dataset.focusTarget) {
                    const targetEl = document.getElementById(dismissBtn.dataset.focusTarget);
                    if (targetEl) {
                        setTimeout(() => targetEl.focus(), 50);
                    }
                }
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
