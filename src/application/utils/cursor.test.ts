import { encodeCursor, decodeCursor } from './cursor';
import { InvalidCursorError } from '@domain/errors/DomainError';

describe('cursor utility', () => {
  // Test will fail because cursor.ts doesn't exist yet
  // That's the RED phase
  
  describe('encodeCursor', () => {
    it('should encode an object to base64 string', () => {
      const input = { lastId: 'abc123', lastSortValue: 1234567890 };
      const result = encodeCursor(input);
      
      // Should be a non-empty base64 string
      expect(typeof result).toBe('string');
      expect(result).not.toBe('');
      // Base64 encoded JSON should be decodable
      expect(atob(result)).toBe(JSON.stringify(input));
    });
    
    it('should handle Date objects in cursor', () => {
      const date = new Date('2024-01-01T00:00:00Z');
      const input = { lastId: 'msg1', lastSortValue: date.toISOString() };
      const result = encodeCursor(input);
      
      expect(typeof result).toBe('string');
      const decoded = decodeCursor(result);
      expect(decoded.lastSortValue).toBe(date.toISOString());
    });
  });
  
  describe('decodeCursor', () => {
    it('should decode a valid base64 cursor', () => {
      const original = { lastId: 'def456', lastSortValue: 9876543210 };
      const encoded = btoa(JSON.stringify(original));
      
      const result = decodeCursor(encoded);
      expect(result).toEqual(original);
    });
    
    it('should throw InvalidCursorError for invalid base64', () => {
      expect(() => decodeCursor('not-valid-base64!@#$')).toThrow(InvalidCursorError);
    });
    
    it('should throw InvalidCursorError for invalid JSON', () => {
      const invalidJson = btoa('{not valid json');
      expect(() => decodeCursor(invalidJson)).toThrow(InvalidCursorError);
    });
    
    it('should throw InvalidCursorError for empty cursor', () => {
      expect(() => decodeCursor('')).toThrow(InvalidCursorError);
    });
  });
  
  describe('round-trip', () => {
    it('should encode and decode back to original', () => {
      const original = { 
        lastId: 'chat123', 
        lastSortValue: new Date().toISOString(),
        extraField: 'test' 
      };
      
      const encoded = encodeCursor(original);
      const decoded = decodeCursor(encoded);
      
      expect(decoded).toEqual(original);
    });
  });
});