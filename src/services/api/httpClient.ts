/**
 * Cliente HTTP para comunicação com o backend customizado
 * Responsável por gerenciar requisições, tokens JWT e tratamento de erros
 */

import { getStoredAuthToken, setStoredAuthToken, removeStoredAuthToken } from '@/utils/authStorage';

// Configuração da API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Tipos para as respostas da API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Opções para requisições
interface RequestOptions {
  headers?: Record<string, string>;
  requiresAuth?: boolean;
}

/**
 * Cliente HTTP para comunicação com a API
 */
class HttpClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Obtém os headers padrão para requisições
   */
  private getHeaders(requiresAuth: boolean = true): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (requiresAuth) {
      const token = getStoredAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Processa a resposta da API
   */
  private async processResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const data = await response.json();

      // Se o status não for de sucesso, trata como erro
      if (!response.ok) {
        // Se for erro de autenticação, remove o token
        if (response.status === 401) {
          removeStoredAuthToken();
        }

        return {
          success: false,
          error: data.error || data.message || 'Erro desconhecido',
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Erro ao processar resposta da API',
      };
    }
  }

  /**
   * Realiza uma requisição GET
   */
  async get<T = any>(
    endpoint: string,
    options: RequestOptions = { requiresAuth: true }
  ): Promise<ApiResponse<T>> {
    try {
      const { requiresAuth = true } = options;
      const headers = this.getHeaders(requiresAuth);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers,
      });

      return this.processResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Realiza uma requisição POST
   */
  async post<T = any>(
    endpoint: string,
    data: any,
    options: RequestOptions = { requiresAuth: true }
  ): Promise<ApiResponse<T>> {
    try {
      const { requiresAuth = true } = options;
      const headers = this.getHeaders(requiresAuth);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      return this.processResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Realiza uma requisição PUT
   */
  async put<T = any>(
    endpoint: string,
    data: any,
    options: RequestOptions = { requiresAuth: true }
  ): Promise<ApiResponse<T>> {
    try {
      const { requiresAuth = true } = options;
      const headers = this.getHeaders(requiresAuth);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });

      return this.processResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Realiza uma requisição PATCH
   */
  async patch<T = any>(
    endpoint: string,
    data: any,
    options: RequestOptions = { requiresAuth: true }
  ): Promise<ApiResponse<T>> {
    try {
      const { requiresAuth = true } = options;
      const headers = this.getHeaders(requiresAuth);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
      });

      return this.processResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Realiza uma requisição DELETE
   */
  async delete<T = any>(
    endpoint: string,
    options: RequestOptions = { requiresAuth: true }
  ): Promise<ApiResponse<T>> {
    try {
      const { requiresAuth = true } = options;
      const headers = this.getHeaders(requiresAuth);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers,
      });

      return this.processResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }
}

// Exporta uma instância única do cliente HTTP
export const httpClient = new HttpClient();

export default httpClient;
