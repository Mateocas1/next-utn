/**
 * IdempotencyStore port interface.
 * 
 * Defines the contract for idempotency key storage.
 * Implementations are provided by the infrastructure layer (Redis).
 */
export interface IdempotencyStore {
  /**
   * Get a stored response by idempotency key.
   * @param key The idempotency key
   * @returns The stored response if found, null otherwise
   */
  get(key: string): Promise<string | null>;
  
  /**
   * Store a response with an idempotency key and TTL.
   * @param key The idempotency key
   * @param response The response to store (serialized)
   * @param ttl Time-to-live in seconds
   */
  set(key: string, response: string, ttl: number): Promise<void>;
  
  /**
   * Check if an idempotency key exists.
   * @param key The idempotency key
   * @returns True if the key exists, false otherwise
   */
  exists(key: string): Promise<boolean>;
}