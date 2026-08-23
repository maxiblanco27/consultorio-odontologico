/**
 * @file supabaseClient.js
 * @description Supabase client initialization and environment detection.
 */

// Production Vercel domain without protocol
export const PROD_HOSTNAME = 'consultorio-odontologico-omega.vercel.app';

let supabaseUrl = '';
let supabaseKey = '';

// Dynamically assign database credentials based on current hostname
if (window.location.hostname === PROD_HOSTNAME) {
    // Production database (Real data)
    supabaseUrl = 'https://alsurmvechfporxbzaed.supabase.co';
    supabaseKey = 'sb_publishable_OTdYnJp9o9QXC6MxhVII7w_0SShMN1n';
} else {
    // Staging / Localhost database (Test data)
    supabaseUrl = 'https://vlwcmikacyeggiatdilx.supabase.co';
    supabaseKey = 'sb_publishable_dQRb-ULM2i2r6hKNznUk2A_nwe4Mr4F';
}

/**
 * Initialized Supabase client instance using the global window.supabase SDK.
 */
export const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
