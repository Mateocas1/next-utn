/**
 * RateLimiter port interface.
 * 
 * Defines the contract for rate limiting operations.
 * Implementations are provided by the infrastructure layer (Redis).
 */
export interface RateLimiter {
  /**
   * Check if a request is allowed under rate limits.
   * @param userId The user ID
   * @param endpoint The API endpoint (e.g., "POST /messages")
   * @returns Rate limit check result
   */
  check(
    userId: string, 
    endpoint: string
  ): Promise<{ 
    allowed: boolean; 
    remaining: number; 
    resetAt: number; // Unix timestamp in seconds
  }>;
}