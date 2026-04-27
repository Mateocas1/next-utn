import { successResponse, errorResponse, SuccessResponse, ErrorResponse } from './response';

describe('response utilities', () => {
  describe('successResponse', () => {
    it('should return success response with data', () => {
      const data = { id: '123', name: 'Test' };
      const result = successResponse(data);
      
      expect(result).toEqual({
        success: true,
        data,
      });
    });

    it('should include meta when provided', () => {
      const data = { items: [] };
      const meta = { page: 1, total: 0 };
      const result = successResponse(data, meta);
      
      expect(result).toEqual({
        success: true,
        data,
        meta,
      });
    });

    it('should handle null data', () => {
      const result = successResponse(null);
      
      expect(result).toEqual({
        success: true,
        data: null,
      });
    });

    it('should handle undefined data', () => {
      const result = successResponse(undefined);
      
      expect(result).toEqual({
        success: true,
        data: undefined,
      });
    });

    it('should handle complex nested data structures', () => {
      const data = {
        chats: [
          { id: '1', participants: ['user1', 'user2'] },
          { id: '2', participants: ['user3', 'user4'] },
        ],
        meta: { count: 2 },
      };
      const result = successResponse(data);
      
      expect(result).toEqual({
        success: true,
        data,
      });
    });

    it('should match SuccessResponse type interface', () => {
      const data = { id: 'test' };
      const result: SuccessResponse<typeof data> = successResponse(data);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
    });
  });

  describe('errorResponse', () => {
    it('should return error response with message and errorCode', () => {
      const result = errorResponse('Not found', 'NOT_FOUND');
      
      expect(result).toEqual({
        success: false,
        data: null,
        message: 'Not found',
        errorCode: 'NOT_FOUND',
      });
    });

    it('should include details when provided', () => {
      const details = [{ field: 'email', message: 'Invalid format' }];
      const result = errorResponse('Validation failed', 'VALIDATION_ERROR', details);
      
      expect(result).toEqual({
        success: false,
        data: null,
        message: 'Validation failed',
        errorCode: 'VALIDATION_ERROR',
        details,
      });
    });

    it('should handle empty details', () => {
      const result = errorResponse('Internal error', 'INTERNAL_ERROR');
      
      expect(result).toEqual({
        success: false,
        data: null,
        message: 'Internal error',
        errorCode: 'INTERNAL_ERROR',
      });
    });

    it('should handle empty string message', () => {
      const result = errorResponse('', 'EMPTY_ERROR');
      
      expect(result).toEqual({
        success: false,
        data: null,
        message: '',
        errorCode: 'EMPTY_ERROR',
      });
    });

    it('should match ErrorResponse type interface', () => {
      const result: ErrorResponse = errorResponse('Test', 'TEST_ERROR');
      
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.message).toBe('Test');
      expect(result.errorCode).toBe('TEST_ERROR');
    });

    it('should handle array details', () => {
      const details = ['error1', 'error2'];
      const result = errorResponse('Multiple errors', 'MULTIPLE_ERRORS', details);
      
      expect(result).toEqual({
        success: false,
        data: null,
        message: 'Multiple errors',
        errorCode: 'MULTIPLE_ERRORS',
        details,
      });
    });
  });
});