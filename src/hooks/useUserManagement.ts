
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { User, UserRole } from '@/types/auth';
import httpClient from '@/services/api/httpClient';

export interface AddUserParams {
  name: string;
  email: string;
  role: UserRole;
  password: string;
}

export function useUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Buscar usuários do backend customizado
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await httpClient.get('/api/users');
      
      if (response.data && response.data.success) {
        // Mapear dados do backend para formato esperado
        const backendUsers = response.data.data || [];
        const mappedUsers: User[] = backendUsers.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as UserRole,
          active: user.status === 'active',
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
          profile: user.profile ? {
            phoneNumber: user.profile.phone
          } : undefined
        }));
        
        setUsers(mappedUsers);
        console.log('Users fetched from backend:', mappedUsers.length);
      } else {
        console.error('Failed to fetch users:', response.data?.error);
        toast({
          title: "Erro ao carregar usuários",
          description: "Não foi possível carregar a lista de usuários.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erro ao carregar usuários",
        description: "Não foi possível conectar com o servidor.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const refreshUsers = () => {
    fetchUsers();
  };

  const addUser = async (userData: AddUserParams) => {
    try {
      const response = await httpClient.post('/api/users', {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        password: userData.password
      });
      
      if (response.data && response.data.success) {
        const newUser = response.data.data;
        
        toast({
          title: "Usuário adicionado",
          description: `${newUser.name} foi adicionado com sucesso.`,
        });
        
        // Refresh the list
        await fetchUsers();
        return newUser;
      } else {
        throw new Error(response.data?.error || 'Erro ao adicionar usuário');
      }
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast({
        title: "Erro ao adicionar usuário",
        description: error.message || "Não foi possível adicionar o usuário.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateUser = async (userData: User) => {
    try {
      const response = await httpClient.put(`/api/users/${userData.id}`, {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        status: userData.active ? 'active' : 'inactive'
      });
      
      if (response.data && response.data.success) {
        toast({
          title: "Usuário atualizado",
          description: `${userData.name} foi atualizado com sucesso.`,
        });
        
        // Refresh the list
        await fetchUsers();
        return userData;
      } else {
        throw new Error(response.data?.error || 'Erro ao atualizar usuário');
      }
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message || "Não foi possível atualizar o usuário.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const userToDelete = users.find(user => user.id === userId);
      
      const response = await httpClient.delete(`/api/users/${userId}`);
      
      if (response.data && response.data.success) {
        toast({
          title: "Usuário excluído",
          description: userToDelete 
            ? `${userToDelete.name} foi excluído com sucesso.` 
            : "Usuário excluído com sucesso.",
        });
        
        // Refresh the list
        await fetchUsers();
      } else {
        throw new Error(response.data?.error || 'Erro ao excluir usuário');
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Erro ao excluir usuário",
        description: error.message || "Não foi possível excluir o usuário.",
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    users,
    isLoading,
    refreshUsers,
    addUser,
    updateUser,
    deleteUser
  };
}

export default useUserManagement;
