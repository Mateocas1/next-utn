import 'ioredis-mock';

jest.mock('ioredis', () => require('ioredis-mock'));
