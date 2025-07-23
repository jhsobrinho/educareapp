/**
 * Hook simplificado para gerenciamento de profissionais
 * Versão refatorada com estado mais limpo e robusto
 */

import { useState, useEffect, useCallback } from 'react';
import { httpClient } from '@/services/api/httpClient';
import { useToast } from '@/hooks/use-toast';

// Tipos simplificados
export interface Professional {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  profile?: {
    id: string;
    profession?: string;
    specialization?: string;
    bio?: string;
    city?: string;
    state?: string;
  };
}

export interface UseProfessionalsReturn {
  professionals: Professional[];
  loading: boolean;
  error: string | null;
  total: number;
  
  // Ações
  fetchProfessionals: () => Promise<void>;
  refreshData: () => Promise<void>;
  updateProfessional: (id: string, data: Partial<Professional>) => Promise<boolean>;
  deleteProfessional: (id: string) => Promise<boolean>;
}

export const useProfessionalManagement = (): UseProfessionalsReturn => {
  // Estados simples e diretos
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  
  const { toast } = useToast();

  // Função principal para buscar profissionais
  const fetchProfessionals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Requisição direta sem cache
      const response = await httpClient.get<{
        professionals: Professional[];
        total: number;
      }>('/users/professionals', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });

      if (response.success && response.data) {
        const { professionals: profList, total: totalCount } = response.data;
        
        // Atualizar estados de forma direta
        setProfessionals(profList || []);
        setTotal(totalCount || 0);
        
        console.log(`✅ ${profList?.length || 0} profissionais carregados`);
      } else {
        const errorMsg = response.error || 'Erro ao carregar profissionais';
        setError(errorMsg);
        setProfessionals([]);
        setTotal(0);
        
        toast({
          title: "Erro",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro inesperado';
      setError(errorMsg);
      setProfessionals([]);
      setTotal(0);
      
      console.error('Erro ao buscar profissionais:', err);
      
      toast({
        title: "Erro",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Função para atualizar dados (força nova requisição)
  const refreshData = useCallback(async () => {
    await fetchProfessionals();
  }, [fetchProfessionals]);

  // Função para atualizar profissional
  const updateProfessional = useCallback(async (id: string, data: Partial<Professional>): Promise<boolean> => {
    try {
      const response = await httpClient.put(`/users/${id}`, data);
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Profissional atualizado com sucesso",
          variant: "default",
        });
        
        // Atualizar lista após edição
        await fetchProfessionals();
        return true;
      } else {
        toast({
          title: "Erro",
          description: response.error || "Erro ao atualizar profissional",
          variant: "destructive",
        });
        return false;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro inesperado';
      toast({
        title: "Erro",
        description: errorMsg,
        variant: "destructive",
      });
      return false;
    }
  }, [fetchProfessionals, toast]);

  // Função para deletar profissional
  const deleteProfessional = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await httpClient.delete(`/users/${id}`);
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Profissional removido com sucesso",
          variant: "default",
        });
        
        // Atualizar lista após exclusão
        await fetchProfessionals();
        return true;
      } else {
        toast({
          title: "Erro",
          description: response.error || "Erro ao remover profissional",
          variant: "destructive",
        });
        return false;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro inesperado';
      toast({
        title: "Erro",
        description: errorMsg,
        variant: "destructive",
      });
      return false;
    }
  }, [fetchProfessionals, toast]);

  // Carregar dados na inicialização
  useEffect(() => {
    fetchProfessionals();
  }, [fetchProfessionals]);

  return {
    professionals,
    loading,
    error,
    total,
    fetchProfessionals,
    refreshData,
    updateProfessional,
    deleteProfessional,
  };
};

export default useProfessionalManagement;
