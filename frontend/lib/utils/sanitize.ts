/**
 * Sanitization utilities to prevent XSS attacks on user-generated content.
 * Uses a runtime check so this can be used safely in both SSR and client-side code.
 *
 * Usage:
 *   import { sanitize, sanitizeUrl } from '@/lib/utils/sanitize';
 *   const safeHtml = sanitize(userInput);
 */

/**
 * Strips all HTML tags and returns plain text.
 * Safe for use in Next.js server components and client components.
 */
export function stripHtml(input: string): string {
  if (!input) return '';
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Sanitizes a URL to prevent javascript: injection attacks.
 * Returns '#' if the URL is unsafe.
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '#';
  const trimmed = url.trim().toLowerCase();
  // Block javascript: and data: URIs
  if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:')) {
    return '#';
  }
  return url;
}

/**
 * Escapes HTML special characters to prevent XSS in contexts where you
 * must render user text in HTML attributes or template literals.
 */
export function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Sanitizes a filename to prevent path traversal attacks.
 * Strips directory separators, null bytes, and special characters.
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return '';
  return filename
    .replace(/[/\\?%*:|"<>]/g, '-') // Replace dangerous chars
    .replace(/\.\./g, '')           // Remove path traversal
    .replace(/\0/g, '')             // Remove null bytes
    .trim();
}

/**
 * Validates that a file's MIME type is in the allowed list.
 * Use this before uploading files to prevent malicious uploads.
 */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
export const ALLOWED_DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;

export function isAllowedFileType(
  file: File,
  allowed: readonly string[] = ALLOWED_IMAGE_TYPES
): boolean {
  return allowed.includes(file.type);
}

export function isAllowedFileSize(file: File, maxSizeMB = 5): boolean {
  return file.size <= maxSizeMB * 1024 * 1024;
}

/**
 * Comprehensive file validation before upload.
 * Returns { valid: true } or { valid: false, error: string }
 */
export function validateFile(
  file: File,
  options: { allowedTypes?: readonly string[]; maxSizeMB?: number } = {}
): { valid: boolean; error?: string } {
  const { allowedTypes = ALLOWED_IMAGE_TYPES, maxSizeMB = 5 } = options;

  if (!isAllowedFileType(file, allowedTypes)) {
    return {
      valid: false,
      error: `File type "${file.type}" is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  if (!isAllowedFileSize(file, maxSizeMB)) {
    return {
      valid: false,
      error: `File size exceeds the ${maxSizeMB}MB limit.`,
    };
  }

  return { valid: true };
}
