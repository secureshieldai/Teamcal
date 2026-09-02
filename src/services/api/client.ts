import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const token = await AsyncStorage.getItem(APP_CONFIG.CACHE_KEYS.AUTH_TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
    const normalized = new Error(message) as Error & { code?: string; status?: number };
    if (error.response?.data?.code) normalized.code = error.response.data.code;
    if (error.response?.status) normalized.status = error.response.status;
    return Promise.reject(normalized);
  }
);
