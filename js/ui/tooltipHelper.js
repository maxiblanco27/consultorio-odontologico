/**
 * @file tooltipHelper.js
 * @description Manages interactive guidance and spotlight action tooltips for clinical history, treatments, and payments.
 * Handles target-anchored callout tooltips on buttons, auto-deployment on screen open, and pulsing highlights.
 */

let currentCallout = null;
let currentPulseElement = null;
let calloutTimer = null;
let activeFormFocusCleanup = null;

/**
 * Dismisses any currently active target action tooltip and cleans up button pulse highlights.
 */
export function dismissActionTooltip() {
    if (calloutTimer) {
        clearTimeout(calloutTimer);
        calloutTimer = null;
    }
    if (currentPulseElement) {
        currentPulseElement.classList.remove('target-spotlight-pulse', 'target-spotlight-pulse-green');
        currentPulseElement = null;
    }
    if (currentCallout) {
        currentCallout.remove();
        currentCallout = null;
    }
}

/**
 * Shows a floating callout tooltip anchored directly over or under a target button or element.
 * @param {HTMLElement|string} target - Target element or selector to anchor to.
 * @param {Object} options
 * @param {string} [options.title='Guía'] - Callout title.
 * @param {string} [options.message=''] - Helpful guide message.
 * @param {string} [options.theme='blue'] - 'blue' | 'green'.
 * @param {string} [options.preferredPosition='top'] - 'top' | 'bottom'.
 * @param {number} [options.delay=350] - Delay in ms before appearing.
 * @param {number} [options.autoDismissTimeout=12000] - Auto-hide timeout in ms.
 */
export function showTargetActionTooltip(target, options = {}) {
    const {
        title = 'Guía',
        message = '',
        theme = 'blue',
        preferredPosition = 'top',
        delay = 350,
        autoDismissTimeout = 12000
    } = options;

    dismissActionTooltip();

    setTimeout(() => {
        const el = typeof target === 'string' ? document.querySelector(target) : target;
        if (!el || !el.isConnected) return;

        // Check if target is inside a hidden modal
        const parentModal = el.closest('.modal-overlay');
        if (parentModal && (parentModal.style.display === 'none' || getComputedStyle(parentModal).display === 'none')) {
            return;
        }

        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        // Ensure element is visible in viewport or scroll container
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        requestAnimationFrame(() => {
            const currentRect = el.getBoundingClientRect();
            if (currentRect.width === 0 || currentRect.height === 0) return;

            // Apply pulse effect to target button
            currentPulseElement = el;
            el.classList.add(theme === 'green' ? 'target-spotlight-pulse-green' : 'target-spotlight-pulse');

            // Dismiss immediately when target button is clicked
            const onTargetClick = () => {
                dismissActionTooltip();
                el.removeEventListener('click', onTargetClick);
            };
            el.addEventListener('click', onTargetClick, { once: true });

            // Build floating callout
            const callout = document.createElement('div');
            callout.className = `spotlight-action-callout theme-${theme}`;
            callout.setAttribute('role', 'tooltip');

            const iconClass = theme === 'green' ? 'fas fa-hand-holding-dollar text-green' : 'fas fa-notes-medical text-blue';

            callout.innerHTML = `
                <div class="callout-header">
                    <div class="callout-title">
                        <i class="${iconClass}"></i>
                        <strong>${title}</strong>
                    </div>
                    <button type="button" class="callout-close-btn" aria-label="Cerrar">&times;</button>
                </div>
                <div class="callout-body">
                    <p>${message}</p>
                </div>
                <div class="callout-footer">
                    <button type="button" class="btn-callout-ack">
                        <i class="fas fa-check"></i> ¡Entendido!
                    </button>
                </div>
            `;

            document.body.appendChild(callout);
            currentCallout = callout;

            // Dimensions and positioning
            const calloutRect = callout.getBoundingClientRect();
            const calloutWidth = calloutRect.width || 280;
            const calloutHeight = calloutRect.height || 100;

            let isPositionTop = preferredPosition === 'top';
            if (isPositionTop && currentRect.top < calloutHeight + 16) {
                isPositionTop = false;
            } else if (!isPositionTop && currentRect.bottom + calloutHeight + 16 > window.innerHeight) {
                isPositionTop = true;
            }

            const top = isPositionTop
                ? currentRect.top - calloutHeight - 12
                : currentRect.bottom + 12;

            let left = currentRect.left + (currentRect.width / 2) - (calloutWidth / 2);
            const margin = 12;
            if (left < margin) left = margin;
            if (left + calloutWidth > window.innerWidth - margin) {
                left = window.innerWidth - margin - calloutWidth;
            }

            const arrowX = Math.max(16, Math.min(calloutWidth - 16, (currentRect.left + currentRect.width / 2) - left));

            callout.style.top = `${top}px`;
            callout.style.left = `${left}px`;
            callout.style.setProperty('--arrow-x', `${arrowX}px`);
            callout.classList.add(isPositionTop ? 'arrow-down' : 'arrow-up');

            // Dismiss actions
            callout.querySelector('.callout-close-btn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                dismissActionTooltip();
            });

            callout.querySelector('.btn-callout-ack')?.addEventListener('click', (e) => {
                e.stopPropagation();
                dismissActionTooltip();
            });

            // Auto dismiss timer
            if (autoDismissTimeout > 0) {
                calloutTimer = setTimeout(() => {
                    dismissActionTooltip();
                }, autoDismissTimeout);
            }
        });
    }, delay);
}

/**
 * Triggers the guidance spotlight over the first "Historial" button on the main patients table.
 */
export function triggerPatientHistorialGuide() {
    const firstHistorialBtn = document.querySelector('#patientsList .btn-historial');
    if (!firstHistorialBtn) return;

    showTargetActionTooltip(firstHistorialBtn, {
        title: 'Botón Historial',
        message: 'Haz clic aquí para ver la ficha clínica y cargar nuevos tratamientos del paciente.',
        theme: 'blue',
        preferredPosition: 'top',
        delay: 500
    });
}

/**
 * Triggers the guidance spotlight over the first "Aportes" button in the clinical history treatments table.
 */
export function triggerTreatmentAportesGuide() {
    const firstAportesBtn = document.querySelector('#treatmentsList .btn-pagos-tratamiento');
    if (firstAportesBtn) {
        showTargetActionTooltip(firstAportesBtn, {
            title: 'Botón Aportes',
            message: 'Haz clic aquí para registrar pagos o aportes económicos a este tratamiento.',
            theme: 'green',
            preferredPosition: 'top',
            delay: 450
        });
    } else {
        // If there are no treatments yet, highlight the Save button to explain the next step
        const saveBtn = document.getElementById('saveTreatmentBtn');
        if (saveBtn) {
            showTargetActionTooltip(saveBtn, {
                title: 'Registrar Tratamiento',
                message: 'Completa los datos arriba y presiona Guardar. Luego aquí podrás cargar sus aportes.',
                theme: 'blue',
                preferredPosition: 'top',
                delay: 450
            });
        }
    }
}

/**
 * Closes all currently opened guidance and assistant tooltips.
 */
export function closeAllTooltips() {
    dismissActionTooltip();

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
 * @param {number} [options.delay=320] - Delay in milliseconds before expanding.
 * @param {string} [options.autoCloseFormId] - Form ID where focusing inputs will auto-dismiss the assistant.
 */
export function openAssistantTooltip(target, options = {}) {
    const { delay = 320, autoCloseFormId = null } = options;

    setTimeout(() => {
        const wrapper = typeof target === 'string' ? document.querySelector(target) : target;
        if (!wrapper) return;

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
            void content.offsetWidth;
            content.classList.add('assistant-glow');
        }

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
        // If clicking outside an active callout, dismiss it
        if (currentCallout && !e.target.closest('.spotlight-action-callout') && !e.target.closest('.target-spotlight-pulse') && !e.target.closest('.target-spotlight-pulse-green')) {
            dismissActionTooltip();
        }

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

                if (dismissBtn && dismissBtn.dataset.focusTarget) {
                    const targetEl = document.getElementById(dismissBtn.dataset.focusTarget);
                    if (targetEl) {
                        setTimeout(() => targetEl.focus(), 50);
                    }
                }
            }
            return;
        }

        if (!e.target.closest('.info-tooltip-content')) {
            closeAllTooltips();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            dismissActionTooltip();
            closeAllTooltips();
        }
    });

    // Window resize / scroll listener to keep position accurate or dismiss
    window.addEventListener('resize', () => {
        if (currentCallout) {
            dismissActionTooltip();
        }
    });
}
