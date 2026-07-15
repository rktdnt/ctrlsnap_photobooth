/**
 * api.ts
 *
 * Helper utility to securely resolve and sanitize the backend API URL.
 * Automatically handles cases where the configured environment variable
 * is missing a protocol prefix (causing relative paths) or resolves to
 * an internal private network address (like .internal) that is inaccessible
 * from the client browser.
 */

const PUBLIC_BACKEND_FALLBACK = 'https://photomatics-photobooth-production.up.railway.app';

export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;

  // 1. If not configured, use fallback
  if (!envUrl) {
    return PUBLIC_BACKEND_FALLBACK;
  }

  const trimmed = envUrl.trim();

  // 2. Reject internal private Railway domains since client browser runs externally
  if (trimmed.includes('.internal')) {
    return PUBLIC_BACKEND_FALLBACK;
  }

  // 3. Ensure it starts with http:// or https:// to prevent relative browser routing
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    // If it's a domain, prepend https://
    return `https://${trimmed}`;
  }

  return trimmed;
}
