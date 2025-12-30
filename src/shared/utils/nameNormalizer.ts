/**
 * Normalizes a name to be compatible with function name requirements:
 * - Must start with a letter or underscore
 * - Only alphanumeric (a-z, A-Z, 0-9), underscores (_), dots (.), colons (:), or dashes (-)
 * - Maximum length of 64 characters
 */

// Character replacement map for common special characters
const charReplacements: Record<string, string> = {
  // Spanish
  'ñ': 'n',
  'Ñ': 'N',
  'á': 'a',
  'é': 'e',
  'í': 'i',
  'ó': 'o',
  'ú': 'u',
  'ü': 'u',
  'Á': 'A',
  'É': 'E',
  'Í': 'I',
  'Ó': 'O',
  'Ú': 'U',
  'Ü': 'U',
  // French
  'à': 'a',
  'â': 'a',
  'ç': 'c',
  'è': 'e',
  'ê': 'e',
  'ë': 'e',
  'î': 'i',
  'ï': 'i',
  'ô': 'o',
  'ù': 'u',
  'û': 'u',
  'ÿ': 'y',
  'À': 'A',
  'Â': 'A',
  'Ç': 'C',
  'È': 'E',
  'Ê': 'E',
  'Ë': 'E',
  'Î': 'I',
  'Ï': 'I',
  'Ô': 'O',
  'Ù': 'U',
  'Û': 'U',
  'Ÿ': 'Y',
  // German
  'ä': 'a',
  'ö': 'o',
  'ß': 'ss',
  'Ä': 'A',
  'Ö': 'O',
  // Portuguese
  'ã': 'a',
  'õ': 'o',
  'Ã': 'A',
  'Õ': 'O',
  // Common symbols
  "'": '',
  '\u2019': '', // Right single quotation mark (')
  '"': '',
  '\u201C': '', // Left double quotation mark (")
  '\u201D': '', // Right double quotation mark (")
  '(': '',
  ')': '',
  '[': '',
  ']': '',
  '{': '',
  '}': '',
  '/': '-',
  '\\': '-',
  '&': 'and',
  '+': 'plus',
  '#': '',
  '@': 'at',
  '!': '',
  '?': '',
  ',': '',
  ';': '',
  '=': '',
  '*': '',
  '%': '',
  '$': '',
  '€': '',
  '£': '',
  '¥': '',
};

/**
 * Normalizes a name to be a valid function name
 */
export function normalizeName(name: string): string {
  let result = name;

  // Replace known special characters
  for (const [char, replacement] of Object.entries(charReplacements)) {
    result = result.split(char).join(replacement);
  }

  // Replace spaces with underscores
  result = result.replace(/\s+/g, '_');

  // Remove any remaining invalid characters (keep only a-z, A-Z, 0-9, _, ., :, -)
  result = result.replace(/[^a-zA-Z0-9_.\-:]/g, '');

  // Ensure it starts with a letter or underscore
  if (result.length > 0 && !/^[a-zA-Z_]/.test(result)) {
    result = '_' + result;
  }

  // Truncate to 64 characters
  if (result.length > 64) {
    result = result.substring(0, 64);
  }

  // If empty after normalization, provide a fallback
  if (result.length === 0) {
    result = '_unnamed';
  }

  return result;
}
