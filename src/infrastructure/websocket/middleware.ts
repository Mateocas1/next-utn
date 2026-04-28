import { Socket } from 'socket.io';
import { JWTService } from '../../auth/JWTService';
import { ExtendedError } from 'socket.io/dist/namespace';

/**
 * Middleware de autenticación para Socket.IO.
 * Valida el token JWT en el handshake.
 */
export function socketIOMiddleware(jwtService: JWTService) {
  return async (socket: Socket, next: (err?: ExtendedError) => void) => {
    try {
      // Extraer token del handshake (auth.token)
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        throw new Error('Authentication token not provided');
      }

      // Verificar token
      const payload = jwtService.verify(token);
      if (!payload.userId) {
        throw new Error('Invalid token payload');
      }

      // Adjuntar userId al socket para uso posterior
      socket.data.userId = payload.userId;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  };
}