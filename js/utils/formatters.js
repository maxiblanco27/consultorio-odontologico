/**
 * @file formatters.js
 * @description Pure utility helper functions for currency, dates, and text formatting.
 */

/**
 * Formats a numerical amount to a localized currency string.
 * @param {number|string} amount - The numerical amount to format.
 * @returns {string} Formatted currency string (e.g. "$ 15.000,00").
 */
export function formatCurrency(amount) {
    const numericValue = parseFloat(amount) || 0;
    return `$ ${numericValue.toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

/**
 * Formats an ISO or YYYY-MM-DD date string into DD/MM/YYYY.
 * @param {string} dateStr - Date string in YYYY-MM-DD or ISO format.
 * @returns {string} Formatted date string (e.g. "23/08/2026") or "-" if empty.
 */
export function formatDate(dateStr) {
    if (!dateStr) return '-';
    // Extract date component if full timestamp is provided
    const dateOnly = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const parts = dateOnly.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
}

/**
 * Returns today's date formatted as YYYY-MM-DD in local time.
 * @returns {string} Date string in YYYY-MM-DD format.
 */
export function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
