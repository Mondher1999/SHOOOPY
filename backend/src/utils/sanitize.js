import { resolve, sep } from "path";

/**
 * Escapes special regex characters in a string to prevent ReDoS attacks.
 * Use on ANY user input before passing to MongoDB $regex queries.
 */
export function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Validates that a file ID contains only safe characters.
 * Prevents path traversal attacks via crafted fileId values.
 */
export function validateFileId(id) {
  return /^[a-zA-Z0-9_-]+$/.test(id);
}

/**
 * Ensures a resolved file path stays within the allowed base directory.
 * Call before any file read/write operation that uses user-supplied paths.
 * Throws if the path escapes the base directory.
 */
/**
 * Escapes a value for safe CSV output.
 * Prevents formula injection (values starting with =, +, -, @, tab, CR)
 * and properly quotes fields containing commas, quotes, or newlines.
 */
export function escapeCSV(val) {
  if (val == null) return "";
  const str = String(val);
  if (/^[=+\-@\t\r]/.test(str)) return `'${str}`;
  if (str.includes(",") || str.includes('"') || str.includes("\n"))
    return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function assertWithin(filePath, baseDir) {
  const resolvedFile = resolve(filePath);
  const resolvedBase = resolve(baseDir);
  if (!resolvedFile.startsWith(resolvedBase + sep) && resolvedFile !== resolvedBase) {
    throw new Error(`Path traversal detected: ${filePath}`);
  }
}
