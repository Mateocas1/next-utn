import { createChatSchema } from './chat.schemas';

describe('createChatSchema', () => {
  it('should fail when recipientId is missing', () => {
    const result = createChatSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it('should fail when recipientId is not a valid uuid', () => {
    const result = createChatSchema.safeParse({ recipientId: 'invalid-id' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Invalid recipient ID');
    }
  });

  it('should pass when recipientId is a valid uuid', () => {
    const result = createChatSchema.safeParse({
      recipientId: '123e4567-e89b-12d3-a456-426614174000',
    });

    expect(result.success).toBe(true);
  });
});
