/**
 * JWTService port interface.
 * 
 * Defines the contract for JWT token operations.
 * Implementations are provided by the infrastructure layer.
 */
export interface JWTService {
  /**
   * Sign a payload into a JWT token.
   * @param payload The payload to sign (typically contains userId)
   * @returns The signed JWT token
   */
  sign(payload: { userId: string }): Promise<string>;
  
  /**
   * Verify and decode a JWT token.
   * @param token The JWT token to verify
   * @returns The decoded payload if valid
   * @throws AuthenticationError if token is invalid or expired
   */
  verify(token: string): Promise<{ userId: string }>;
}