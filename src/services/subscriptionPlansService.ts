import { getStoredAuthToken } from '@/utils/authStorage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_cycle: 'monthly' | 'yearly';
  trial_days: number;
  features: Record<string, boolean>;
  limits: Record<string, number | string>;
  is_active: boolean;
  is_public: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSubscriptionPlanData {
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_cycle: 'monthly' | 'yearly';
  trial_days: number;
  features: Record<string, boolean>;
  limits: Record<string, number | string>;
  is_active: boolean;
  is_public: boolean;
  sort_order: number;
}

export interface UpdateSubscriptionPlanData extends CreateSubscriptionPlanData {
  id: string;
}

class SubscriptionPlansService {
  private getAuthHeaders() {
    const token = getStoredAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getAllPlans(): Promise<SubscriptionPlan[]> {
    try {
      const response = await fetch(`${API_URL}/api/subscription-plans`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar planos: ${response.statusText}`);
      }

      const data = await response.json();
      return data.plans || data;
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
      throw error;
    }
  }

  async getPublicPlans(): Promise<SubscriptionPlan[]> {
    try {
      const response = await fetch(`${API_URL}/api/subscription-plans/public`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar planos públicos: ${response.statusText}`);
      }

      const data = await response.json();
      return data.plans || data;
    } catch (error) {
      console.error('Erro ao buscar planos públicos:', error);
      throw error;
    }
  }

  async getPlanById(id: string): Promise<SubscriptionPlan> {
    try {
      const response = await fetch(`${API_URL}/api/subscription-plans/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar plano: ${response.statusText}`);
      }

      const data = await response.json();
      return data.plan || data;
    } catch (error) {
      console.error('Erro ao buscar plano:', error);
      throw error;
    }
  }

  async createPlan(planData: CreateSubscriptionPlanData): Promise<SubscriptionPlan> {
    try {
      const response = await fetch(`${API_URL}/api/subscription-plans`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(planData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ao criar plano: ${response.statusText}`);
      }

      const data = await response.json();
      return data.plan || data;
    } catch (error) {
      console.error('Erro ao criar plano:', error);
      throw error;
    }
  }

  async updatePlan(id: string, planData: Partial<CreateSubscriptionPlanData>): Promise<SubscriptionPlan> {
    try {
      const response = await fetch(`${API_URL}/api/subscription-plans/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(planData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ao atualizar plano: ${response.statusText}`);
      }

      const data = await response.json();
      return data.plan || data;
    } catch (error) {
      console.error('Erro ao atualizar plano:', error);
      throw error;
    }
  }

  async deletePlan(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/api/subscription-plans/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ao excluir plano: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erro ao excluir plano:', error);
      throw error;
    }
  }

  async togglePlanStatus(id: string, isActive: boolean): Promise<SubscriptionPlan> {
    try {
      const response = await fetch(`${API_URL}/api/subscription-plans/${id}/toggle-status`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ is_active: isActive }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ao alterar status do plano: ${response.statusText}`);
      }

      const data = await response.json();
      return data.plan || data;
    } catch (error) {
      console.error('Erro ao alterar status do plano:', error);
      throw error;
    }
  }

  async comparePlans(planIds: string[]): Promise<{ plans: SubscriptionPlan[]; comparison: Record<string, unknown> }> {
    try {
      const response = await fetch(`${API_URL}/api/subscription-plans/compare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planIds }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao comparar planos: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao comparar planos:', error);
      throw error;
    }
  }

  // Métrica para dashboard owner
  async getPlanMetrics(): Promise<{
    totalPlans: number;
    activePlans: number;
    publicPlans: number;
    totalRevenue: number;
    plansByType: Record<string, number>;
  }> {
    try {
      const response = await fetch(`${API_URL}/api/subscription-plans/metrics`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar métricas dos planos: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao buscar métricas dos planos:', error);
      throw error;
    }
  }
}

export const subscriptionPlansService = new SubscriptionPlansService();
