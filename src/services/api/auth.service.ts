import { apiClient } from './client';
import { storage } from '../storage';
import type { AuthResponse, RegistrationResponse, User } from '../../types/api';

export const authService = {
  async register(email: string, password: string, name: string, acceptedTerms: boolean, referralCode?: string) {
    const { data } = await apiClient.post<RegistrationResponse>('/auth/register', {
      email, password, name, acceptedTerms, referralCode,
    });
    return data;
  },

  async verifyEmail(verificationToken: string, code: string) {
    const { data } = await apiClient.post<AuthResponse>('/auth/verification/verify', {
      verificationToken,
      code,
    });
    await storage.setToken(data.token);
    await storage.setUser(data.user);
    return data;
  },

  async resendVerification(verificationToken: string) {
    const { data } = await apiClient.post<{ success: boolean; message: string }>(
      '/auth/verification/resend',
      { verificationToken }
    );
    return data;
  },

  async login(email: string, password: string) {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    await storage.setToken(data.token);
    await storage.setUser(data.user);
    return data;
  },

  async firebase(idToken: string) {
    const { data } = await apiClient.post<AuthResponse>('/auth/firebase', { idToken });
    await storage.setToken(data.token);
    await storage.setUser(data.user);
    return data;
  },

  async me() {
    const { data } = await apiClient.get<{ success: boolean; user: User }>('/auth/me');
    await storage.setUser(data.user);
    return data.user;
  },

  async logout() {
    await storage.clear();
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const { data } = await apiClient.patch<{ success: boolean; message: string }>('/auth/password', {
      currentPassword, newPassword,
    });
    return data;
  },
  async deleteAccount(){await apiClient.delete('/auth/account');await storage.clear();},
  async requestPasswordReset(email:string){const {data}=await apiClient.post<{success:boolean;verificationToken:string;message:string}>('/auth/password-reset/request',{email});return data;},
  async verifyPasswordReset(verificationToken:string,code:string){const {data}=await apiClient.post<{success:boolean;resetToken:string}>('/auth/password-reset/verify',{verificationToken,code});return data;},
  async resetPassword(resetToken:string,newPassword:string){const {data}=await apiClient.post<{success:boolean;message:string}>('/auth/password-reset/complete',{resetToken,newPassword});return data;},
};
