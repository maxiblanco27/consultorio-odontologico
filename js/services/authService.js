/**
 * @file authService.js
 * @description Data access and authentication service using Supabase Auth.
 */

import { supabaseClient } from '../config/supabaseClient.js';

/**
 * Authenticates a user with email and password.
 * @param {string} email - User's email address.
 * @param {string} password - User's password.
 * @returns {Promise<{ user: Object|null, session: Object|null, error: Error|null }>}
 */
export async function signIn(email, password) {
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email.trim(),
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
