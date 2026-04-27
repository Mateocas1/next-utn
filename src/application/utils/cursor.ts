import { InvalidCursorError } from '@domain/errors/DomainError';

/**
 * Cursor pagination utility.
 * 
 * Provides functions for encoding and decoding cursor values for pagination.
 * Cursors are base64-encoded JSON objects containing the last seen values
 * of sorted fields (e.g., `_id` and `updatedAt`).
 */

/**
 * Encode a cursor object to a base64 string.
 * @param values Record of key-value pairs to encode
 * @returns Base64-encoded JSON string
 */
export function encodeCursor(values: Record<string, unknown>): string {
  const json = JSON.stringify(values);
  return Buffer.from(json).toString('base64');
}

/**
 * Decode a cursor string back to an object.
 * @param cursor Base64-encoded JSON string
 * @returns Decoded object
 * @throws InvalidCursorError if cursor is invalid
 */
export function decodeCursor(cursor: string): Record<string, unknown> {
  if (!cursor || typeof cursor !== 'string') {
    throw new InvalidCursorError();
  }
  
  try {
    const json = Buffer.from(cursor, 'base64').toString('utf-8');
    const decoded = JSON.parse(json);
    
    if (typeof decoded !== 'object' || decoded === null) {
      throw new InvalidCursorError();
    }
    
    return decoded;
  } catch (error) {
    if (error instanceof InvalidCursorError) {
      throw error;
    }
    throw new InvalidCursorError();
  }
}