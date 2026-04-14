/**
 * HTML sanitization utility to prevent XSS attacks
 */

/**
 * Escapes HTML special characters to prevent XSS
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Sanitizes a number value for safe HTML insertion
 */
export function sanitizeNumber(value: number): string {
  return isNaN(value) ? "0" : Math.abs(value).toString();
}

/**
 * Sanitizes a string for safe CSS value insertion
 */
export function sanitizeCssValue(value: string): string {
  // Only allow alphanumeric, hyphens, spaces, and common CSS units
  return value.replace(/[^a-zA-Z0-9\s\-%.#]/g, '');
}