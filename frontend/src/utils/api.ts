/**
 * api.ts
 *
 * Helper utility to securely resolve and sanitize the backend API URL.
 * Defaults to empty string (relative path `/api/...`) when hosted on Vercel
 * (where frontend and serverless API endpoints run on the same domain).
 */

export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;

  // 1. If not configured, default to empty string for relative routing on Vercel
  if (!envUrl) {
    return '';
  }

  const trimmed = envUrl.trim().replace(/\/+$/, '');

  // 2. Reject internal private or legacy Railway domains
  if (trimmed.includes('.internal') || trimmed.includes('railway.app')) {
    return '';
  }

  // 3. Ensure it starts with http:// or https:// to prevent relative browser routing
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

