/**
 * @file authService.js
 * @description Data access and authentication service using Supabase Auth.
 */

import { supabaseClient } from '../config/supabaseClient.js';

export const AUTH_DEFAULT_DOMAIN = '@consultorio.local';

/**
 * Normalizes an identifier (username or email).
 * If no '@' is present, appends the default domain.
 * @param {string} identifier - Username or email.
 * @returns {string} Normalized email string.
 */
export function normalizeAuthIdentifier(identifier) {
    const clean = (identifier || '').trim().toLowerCase();
    if (!clean) return '';
    return clean.includes('@') ? clean : `${clean}${AUTH_DEFAULT_DOMAIN}`;
}

/**
 * Extracts a friendly display name from an email or identifier.
 * @param {string} email - Email address.
 * @returns {string} Display username.
 */
export function getDisplayUsername(email) {
    if (!email) return 'Usuario';
    const clean = email.trim();
    if (clean.toLowerCase().endsWith(AUTH_DEFAULT_DOMAIN)) {
        return clean.slice(0, -AUTH_DEFAULT_DOMAIN.length);
    }
    return clean.split('@')[0];
}

/**
 * Authenticates a user with username or email and password.
 * @param {string} identifier - User's username or email address.
 * @param {string} password - User's password.
 * @returns {Promise<{ user: Object|null, session: Object|null, error: Error|null }>}
 */
export async function signIn(identifier, password) {
    try {
        const email = normalizeAuthIdentifier(identifier);
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error('Sign-in error:', error);
            return { user: null, session: null, error };
        }

        return { user: data.user, session: data.session, error: null };
    } catch (err) {
        console.error('Unexpected error during sign-in:', err);
        return { user: null, session: null, error: err };
    }
}

/**
 * Terminates the current active session.
 * @returns {Promise<{ error: Error|null }>}
 */
export async function signOut() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) {
            console.error('Sign-out error:', error);
            return { error };
        }
        return { error: null };
    } catch (err) {
        console.error('Unexpected error during sign-out:', err);
        return { error: err };
    }
}

/**
 * Retrieves the current session from local storage or memory.
 * @returns {Promise<{ session: Object|null, error: Error|null }>}
 */
export async function getSession() {
    try {
        const { data, error } = await supabaseClient.auth.getSession();
        if (error) {
            console.error('Error fetching session:', error);
            return { session: null, error };
        }
        return { session: data.session, error: null };
    } catch (err) {
        console.error('Unexpected error in getSession:', err);
        return { session: null, error: err };
    }
}

/**
 * Retrieves the currently authenticated user details.
 * @returns {Promise<{ user: Object|null, error: Error|null }>}
 */
export async function getCurrentUser() {
    try {
        const { data, error } = await supabaseClient.auth.getUser();
        if (error) {
            return { user: null, error };
        }
        return { user: data.user, error: null };
    } catch (err) {
        return { user: null, error: err };
    }
}

/**
 * Registers a listener for authentication state changes (SIGN_IN, SIGN_OUT, TOKEN_REFRESHED, etc.).
 * @param {Function} callback - Function invoked with (event, session).
 * @returns {Object} Supabase auth state change subscription.
 */
export function onAuthStateChange(callback) {
    return supabaseClient.auth.onAuthStateChange((event, session) => {
        if (typeof callback === 'function') {
            callback(event, session);
        }
    });
}
