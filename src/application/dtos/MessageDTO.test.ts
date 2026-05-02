import { MessageDTO } from './MessageDTO';

describe('MessageDTO', () => {
  it('should enforce the expected flat transport contract', () => {
    const dto: MessageDTO = {
      id: 'message-1',
      chatId: 'chat-1',
      senderId: 'user-1',
      content: 'hello',
      createdAt: '2026-05-01T10:00:00.000Z'
    };

    expect(dto).toEqual({
      id: 'message-1',
      chatId: 'chat-1',
      senderId: 'user-1',
      content: 'hello',
      createdAt: '2026-05-01T10:00:00.000Z'
    });
    expect(typeof dto.createdAt).toBe('string');
  });
});
