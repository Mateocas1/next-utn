export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ErrorResponse {
  success: false;
  data: null;
  message: string;
  errorCode: string;
  details?: unknown[];
}

export function successResponse<T = any>(
  data: T,
  meta?: Record<string, unknown>
): SuccessResponse<T> {
  return {
    success: true,
    data,
    ...(meta && { meta }),
  };
}

export function errorResponse(
  message: string,
  errorCode: string,
  details?: unknown[]
): ErrorResponse {
  return {
    success: false,
    data: null,
    message,
    errorCode,
    ...(details && { details }),
  };
}