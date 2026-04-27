import axiosInstance from '../../lib/axios';
import { LoginResponse, RegisterResponse } from '../types';

// API call for login
export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await axiosInstance.post<LoginResponse>('/auth/login', { email, password });
  return response.data;
};

// API call for registration
export const register = async (email: string, password: string): Promise<RegisterResponse> => {
  const response = await axiosInstance.post<RegisterResponse>('/auth/register', { email, password });
  return response.data;
};