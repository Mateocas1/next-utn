export interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    user: string;
  };
  message?: string;
}

export interface RegisterResponse {
  success: boolean;
  data: {
    token: string;
    user: string;
  };
  message?: string;
}