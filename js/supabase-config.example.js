/**
 * Main config lives in supabase-config.js (committed).
 * Optional: copy this file to supabase-config.local.js to override locally (gitignored).
 *
 * Get values from: Supabase Dashboard → Project Settings → API Keys
 *   - Project URL (without /rest/v1)
 *   - anon public key (NOT service_role)
 */
window.HALAL_SUPABASE_CONFIG = {
  url: "https://YOUR_PROJECT_REF.supabase.co",
  anonKey: "YOUR_ANON_PUBLIC_KEY",
};
