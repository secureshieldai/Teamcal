import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { storage } from '../auth/secureStorage';
import { ENV } from '../../app/config/env';
import { APP_CONFIG } from '../../app/config/constants';

const BASE_URL = ENV.API_URL;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: APP_CONFIG.API.TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await storage.getToken();
  console.log('[API Client] Token retrieved:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('[API Client] Authorization header set');
  } else {
    console.warn('[API Client] No token found - request will be unauthenticated');
  }
  return config;
});

// Normalize error shape
apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ message?: string; code?: string }>) => {
    const message =
      error.response?.data?.message ??
      error.message ??
      'Something went wrong';
    
    const normalized = new Error(message) as Error & { 
      code?: string; 
      status?: number;
      response?: typeof error.response;
    };
    
    if (error.response?.data?.code) normalized.code = error.response.data.code;
    if (error.response?.status) normalized.status = error.response.status;
    
    // Preserve the response object for detailed error handling
    normalized.response = error.response;
    
    console.error('[API Client] Request failed:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: message,
    });
    
    return Promise.reject(normalized);
  }
);
