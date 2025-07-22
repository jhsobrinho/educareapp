/**
 * Serviço de autenticação para comunicação com o backend customizado
 * Substitui o serviço anterior baseado em Supabase
 */

import httpClient, { ApiResponse } from './httpClient';
import { 
  setStoredAuthToken, 
  setStoredRefreshToken, 
  setStoredUserData,
  getStoredRefreshToken,
  clearAuthStorage
} from '@/utils/authStorage';

// Tipos
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser | null;
  error?: string;
  token?: string;
  refreshToken?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: string;
}

export interface PhoneVerificationData {
  phone: string;
}

export interface PhoneVerificationResult {
  success: boolean;
  message?: string;
  expiresAt?: Date;
  error?: string;
}

export interface PhoneCodeVerificationData {
  phone: string;
  code: string;
}

/**
 * Login com email e senha
 */
export const signInWithEmail = async (email: string, password: string): Promise<AuthResult> => {
  try {
    const response = await httpClient.post<{
      user: AuthUser;
      token: string;
      refreshToken: string;
    }>('/api/auth/login', { email, password }, { requiresAuth: false });

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || 'Erro ao fazer login'
      };
    }

    const { user, token, refreshToken } = response.data;

    // Armazena os dados de autenticação
    setStoredAuthToken(token);
    setStoredRefreshToken(refreshToken);
    setStoredUserData(user);

    return {
      success: true,
      user,
      token,
      refreshToken
    };
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao fazer login'
    };
  }
};

/**
 * Registro de novo usuário
 */
export const signUpWithEmail = async (
  email: string, 
  password: string, 
  name: string,
  phone?: string,
  role: string = 'user'
): Promise<AuthResult> => {
  try {
    const requestBody: any = { email, password, name, role };
    if (phone) {
      requestBody.phone = phone;
    }
    
    const response = await httpClient.post<{
      user: AuthUser;
      token: string;
      refreshToken: string;
    }>('/api/auth/register', requestBody, { requiresAuth: false });

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || 'Erro ao registrar usuário'
      };
    }

    const { user, token, refreshToken } = response.data;

    // Armazena os dados de autenticação
    setStoredAuthToken(token);
    setStoredRefreshToken(refreshToken);
    setStoredUserData(user);

    return {
      success: true,
      user,
      token,
      refreshToken
    };
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao registrar usuário'
    };
  }
};

/**
 * Logout do usuário
 */
export const signOut = async (): Promise<boolean> => {
  try {
    // Tenta fazer logout no servidor
    await httpClient.post('/api/auth/logout', {});
    
    // Independente da resposta do servidor, limpa os dados locais
    clearAuthStorage();
    
    return true;
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    
    // Mesmo com erro, limpa os dados locais
    clearAuthStorage();
    
    return false;
  }
};

/**
 * Recuperação de senha
 */
export const resetPassword = async (email: string): Promise<ApiResponse> => {
  try {
    return await httpClient.post('/api/auth/reset-password', { email }, { requiresAuth: false });
  } catch (error) {
    console.error('Erro ao solicitar recuperação de senha:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao solicitar recuperação de senha'
    };
  }
};

/**
 * Atualização de senha
 */
export const updatePassword = async (currentPassword: string, newPassword: string): Promise<ApiResponse> => {
  try {
    return await httpClient.post('/api/auth/update-password', { 
      currentPassword, 
      newPassword 
    });
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao atualizar senha'
    };
  }
};

/**
 * Renovação de token usando refresh token
 */
export const refreshAuthToken = async (): Promise<AuthResult> => {
  try {
    const refreshToken = getStoredRefreshToken();
    
    if (!refreshToken) {
      return {
        success: false,
        error: 'Refresh token não encontrado'
      };
    }
    
    const response = await httpClient.post<{
      token: string;
      refreshToken: string;
    }>('/api/auth/refresh-token', { refreshToken }, { requiresAuth: false });

    if (!response.success || !response.data) {
      // Se falhar, limpa os dados de autenticação
      clearAuthStorage();
      
      return {
        success: false,
        error: response.error || 'Erro ao renovar token'
      };
    }

    const { token, refreshToken: newRefreshToken } = response.data;

    // Atualiza os tokens
    setStoredAuthToken(token);
    setStoredRefreshToken(newRefreshToken);

    return {
      success: true,
      token,
      refreshToken: newRefreshToken
    };
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    
    // Em caso de erro, limpa os dados de autenticação
    clearAuthStorage();
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao renovar token'
    };
  }
};

/**
 * Enviar código de verificação para telefone/WhatsApp
 */
export const sendPhoneVerification = async (phone: string): Promise<PhoneVerificationResult> => {
  try {
    const response = await httpClient.post<{
      message: string;
      expiresAt: string;
    }>('/api/auth/send-phone-verification', { phone }, { requiresAuth: false });

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || 'Erro ao enviar código de verificação'
      };
    }

    return {
      success: true,
      message: response.data.message,
      expiresAt: new Date(response.data.expiresAt)
    };
  } catch (error) {
    console.error('Erro ao enviar código de verificação:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao enviar código de verificação'
    };
  }
};

/**
 * Verificar código enviado para telefone/WhatsApp
 */
export const verifyPhoneCode = async (phone: string, code: string): Promise<AuthResult> => {
  try {
    const response = await httpClient.post<{
      user: AuthUser;
      token: string;
      refreshToken: string;
    }>('/api/auth/verify-phone-code', { phone, code }, { requiresAuth: false });

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || 'Erro ao verificar código'
      };
    }

    const { user, token, refreshToken } = response.data;

    // Armazena os dados de autenticação
    setStoredAuthToken(token);
    setStoredRefreshToken(refreshToken);
    setStoredUserData(user);

    return {
      success: true,
      user,
      token,
      refreshToken
    };
  } catch (error) {
    console.error('Erro ao verificar código de telefone:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao verificar código'
    };
  }
};
