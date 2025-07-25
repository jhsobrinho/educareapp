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
   * Constrói a URL completa para o endpoint
   */
  private buildUrl(endpoint: string): string {
    // Remove barra inicial se existir
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    // Adiciona /api automaticamente se não estiver presente
    const apiEndpoint = cleanEndpoint.startsWith('api/') ? cleanEndpoint : `api/${cleanEndpoint}`;
    return `${this.baseUrl}/${apiEndpoint}`;
  }

  /**
   * Obtém os headers padrão para requisições
   */
  private getHeaders(requiresAuth: boolean = true): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      // Headers para evitar cache e forçar requisições frescas
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
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
      // Trata especificamente status 304 (Not Modified)
      if (response.status === 304) {
        console.warn('🔄 HTTP 304 - Usando cache, mas forçando nova requisição...');
        // Para 304, consideramos como sucesso mas sem dados novos
        return {
          success: true,
          data: undefined as T,
          message: 'Dados em cache (304 Not Modified)',
        };
      }

      // Tenta processar JSON da resposta
      let data: any;
      try {
        const responseText = await response.text();
        if (responseText) {
          data = JSON.parse(responseText);
        } else {
          data = {};
        }
      } catch (jsonError) {
        console.warn('⚠️ Erro ao processar JSON da resposta:', jsonError);
        data = {};
      }

      // Se o status não for de sucesso, trata como erro
      if (!response.ok) {
        // Se for erro de autenticação, remove o token
        if (response.status === 401) {
          removeStoredAuthToken();
        }

        return {
          success: false,
          error: data.error || data.message || `Erro HTTP ${response.status}: ${response.statusText}`,
        };
      }

      // Processa resposta de sucesso
      console.log('🔍 DEBUG HttpClient.processResponse - Dados recebidos do backend:', data);
      console.log('🔍 DEBUG HttpClient.processResponse - data.success:', data.success);
      console.log('🔍 DEBUG HttpClient.processResponse - typeof data.success:', typeof data.success);
      
      // Se o backend já retorna success: true, mantém a estrutura original
      if (data.success !== undefined) {
        console.log('✅ DEBUG: Backend retorna success, mantendo estrutura original');
        return {
          success: data.success,
          data: data.data,
          error: data.error,
          message: data.message,
        };
      }
      
      // Para respostas que não seguem o padrão, processa como antes
      console.log('⚠️ DEBUG: Backend NÃO retorna success, processando como antes');
      const processedData = data.data !== undefined ? data.data : data;
      
      return {
        success: true,
        data: processedData,
        message: data.message,
      };
    } catch (error) {
      console.error('❌ Erro ao processar resposta da API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao processar resposta da API',
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

      const response = await fetch(this.buildUrl(endpoint), {
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

      const response = await fetch(this.buildUrl(endpoint), {
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

      const response = await fetch(this.buildUrl(endpoint), {
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

      const response = await fetch(this.buildUrl(endpoint), {
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

      const response = await fetch(this.buildUrl(endpoint), {
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
