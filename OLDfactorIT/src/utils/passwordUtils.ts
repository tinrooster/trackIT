/**
 * Password utility functions for hashing and validation
 */

/**
 * Validates if a password meets the minimum requirements:
 * - At least 4 characters long
 */
export const validatePassword = (password: string): boolean => {
  const minLength = 4;
  return password.length >= minLength;
};

/**
 * Validates a password against security requirements
 * @param password The password to validate
 * @returns Error message if invalid, null if valid
 */
export function getPasswordError(password: string): string | null {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < 4) {
    return 'Password must be at least 4 characters long';
  }
  return null;
}

/**
 * Generates a random temporary password that meets the requirements
 */
export const generateTempPassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let tempPassword = '';
  for (let i = 0; i < 8; i++) {
    tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return tempPassword;
};

/**
 * Compare a password with a stored password
 * @param inputPassword The password to check
 * @param storedPassword The stored password to compare against
 * @returns True if passwords match
 */
export function comparePasswords(inputPassword: string, storedPassword: string): boolean {
  console.log('PasswordUtils: Comparing passwords');
  console.log('PasswordUtils: Input password length:', inputPassword?.length);
  console.log('PasswordUtils: Stored password length:', storedPassword?.length);
  const result = inputPassword === storedPassword;
  console.log('PasswordUtils: Password match result:', result);
  return result;
}

/**
 * Hashes a password
 * Note: In a production environment, use a proper cryptographic hashing function
 * @param password The password to hash
 * @returns The hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  // For demo purposes, we're just returning the password as-is
  // In production, use bcrypt or similar
  return password;
} 