import React, { createContext, useEffect, useState } from 'react';
import type { AuthContextType } from '@/contexts/AuthContext';
import { ROLE_PERMISSIONS } from '@/hooks/usePermissions';
import type { Permission, UserRole, User } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';
import { 
  signInWithEmail, 
  signUpWithEmail, 
  signOut, 
  refreshAuthToken,
  sendPhoneVerification,
  verifyPhoneCode,
  AuthUser
} from '@/services/api/authService';
import { 
  getStoredAuthToken, 
  getStoredUserData, 
  clearAuthStorage 
} from '@/utils/authStorage';

// Contexto de autenticação
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Função auxiliar para converter AuthUser para o formato User do frontend
const convertApiUser = (apiUser: AuthUser | null): User | null => {
  if (!apiUser) return null;
  
  return {
    id: apiUser.id,
    uid: apiUser.id,
    name: apiUser.name || 'Usuário',
    displayName: apiUser.name || 'Usuário',
    email: apiUser.email || '',
    photoURL: '',
    avatar: '',
    role: (apiUser.role as UserRole) || 'parent',
    isEmailVerified: true, // Assumimos que o backend já verificou o email
    createdAt: '',
    lastLoginAt: '',
    active: true,
    accessLevel: 'basic',
    profile: {
      title: '',
      organization: '',
      bio: '',
      phoneNumber: ''
    }
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const { toast } = useToast();

  // Inicializar autenticação
  useEffect(() => {
    console.log('CustomAuthProvider: Inicializando autenticação');
    
    const initAuth = async () => {
      try {
        // Verificar se há token armazenado
        const token = getStoredAuthToken();
        console.log('=== DEBUG AUTH INIT ===');
        console.log('Token encontrado:', !!token);
        console.log('Token value:', token ? token.substring(0, 20) + '...' : 'null');
        
        if (token) {
          console.log('Token encontrado, tentando restaurar sessão');
          
          // Tentar obter dados do usuário do armazenamento local
          const userData = getStoredUserData();
          console.log('UserData encontrado:', !!userData);
          console.log('UserData:', userData);
          
          if (userData) {
            setUser(convertApiUser(userData));
            setIsLoading(false);
            setIsInitialized(true);
            
            // Tentar renovar o token em segundo plano (sem forçar logout)
            try {
              console.log('Tentando renovar token em segundo plano...');
              const refreshResult = await refreshAuthToken();
              if (refreshResult.success && refreshResult.user) {
                console.log('Token renovado com sucesso');
                setUser(convertApiUser(refreshResult.user));
              } else {
                // Se a renovação falhar, manter usuário logado com token atual
                console.warn('Falha ao renovar token, mantendo sessão atual');
                // NÃO fazer logout - deixar o usuário continuar
              }
            } catch (error) {
              console.error('Erro ao renovar token:', error);
              // Não fazer logout - manter sessão ativa
              console.log('Mantendo sessão ativa apesar do erro de renovação');
            }
          } else {
            // Se não houver dados do usuário, limpar autenticação
            console.warn('Token encontrado, mas sem dados do usuário');
            clearAuthStorage();
            setUser(null);
            setIsLoading(false);
            setIsInitialized(true);
          }
        } else {
          // Sem token, usuário não está autenticado
          console.log('Nenhum token encontrado, usuário não autenticado');
          setUser(null);
          setIsLoading(false);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
        setUser(null);
        setIsLoading(false);
        setIsInitialized(true);
      }
    };
    
    initAuth();
    
    // Configurar temporizador para renovação de token
    const tokenRefreshInterval = setInterval(async () => {
      const token = getStoredAuthToken();
      if (token) {
        try {
          console.log('Renovando token automaticamente');
          await refreshAuthToken();
        } catch (error) {
          console.error('Erro ao renovar token automaticamente:', error);
        }
      }
    }, 15 * 60 * 1000); // 15 minutos
    
    return () => {
      clearInterval(tokenRefreshInterval);
    };
  }, []);

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    
    const userRole = user.role || 'parent';
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];
    
    return userPermissions.includes(permission);
  };
  
  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false;
    
    const userRole = user.role || 'parent';
    
    if (Array.isArray(role)) {
      return role.includes(userRole);
    }
    
    return userRole === role;
  };
  
  const getRoleName = (role: UserRole): string => {
    const roleNames: Record<string, string> = {
      parent: 'Pai/Mãe',
      professional: 'Profissional',
      admin: 'Administrador',
      owner: 'Proprietário',
      user: 'Usuário'
    };
    
    return roleNames[role] || 'Usuário';
  };

  // Método de login
  const handleLogin = async (email: string, password: string, rememberMe = false): Promise<User | null> => {
    try {
      setIsLoading(true);
      
      const result = await signInWithEmail(email, password);
      
      if (result.success && result.user) {
        const convertedUser = convertApiUser(result.user);
        
        // Debug: verificar se dados foram armazenados
        console.log('=== DEBUG LOGIN SUCCESS ===');
        console.log('Token armazenado:', !!getStoredAuthToken());
        console.log('UserData armazenado:', !!getStoredUserData());
        console.log('Converted user:', convertedUser);
        
        setUser(convertedUser);
        return convertedUser;
      } else {
        throw new Error(result.error || 'Falha ao fazer login');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro de autenticação',
        description: errorMessage || 'Falha ao fazer login. Verifique suas credenciais.',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Método de registro
  const handleRegister = async (
    name: string, 
    email: string, 
    password: string, 
    role: UserRole = 'parent',
    agreeTerms = true,
    phone?: string,
    plan_id?: string
  ): Promise<User | null> => {
    // CORREÇÃO: Garantir que os parâmetros sejam mapeados corretamente
    // Se role contém números (telefone), trocar com phone
    let finalRole = role;
    let finalPhone = phone;
    let finalPlanId = plan_id;
    
    // Detectar se role contém telefone (apenas números)
    if (typeof role === 'string' && /^\d+$/.test(role)) {
      console.log('DETECTADO: role contém telefone, corrigindo parâmetros...');
      finalPhone = role;
      finalRole = 'parent'; // Assumir parent como padrão
      // Preservar plan_id original que foi selecionado no formulário
      // finalPlanId já está correto, não alterar
    }
    
    console.log('=== DEBUG HANDLEREGISTER - Parâmetros corrigidos ===');
    console.log('name:', name);
    console.log('email:', email);
    console.log('password:', '***');
    console.log('finalRole:', finalRole);
    console.log('finalPhone:', finalPhone);
    console.log('finalPlanId:', finalPlanId);
    console.log('=== FIM DEBUG HANDLEREGISTER ===');
    
    if (!agreeTerms) {
      toast({
        title: 'Termos de uso',
        description: 'Você precisa concordar com os termos de uso para se registrar',
        variant: 'destructive'
      });
      return null;
    }
    
    try {
      setIsLoading(true);
      
      const result = await signUpWithEmail(email, password, name, finalRole, finalPhone, finalPlanId);
      
      if (result.success && result.user) {
        const convertedUser = convertApiUser(result.user);
        setUser(convertedUser);
        return convertedUser;
      } else {
        throw new Error(result.error || 'Falha ao registrar');
      }
    } catch (error) {
      console.error('Erro no registro:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro no registro',
        description: errorMessage || 'Falha ao criar conta. Tente novamente.',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Método de logout
  const handleLogout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await signOut();
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Método para enviar código de verificação para telefone/WhatsApp
  const handleSendPhoneVerification = async (phone: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const result = await sendPhoneVerification(phone);
      
      if (result.success) {
        toast({
          title: 'Código enviado',
          description: 'Um código de verificação foi enviado para o seu telefone.',
          variant: 'default'
        });
        return true;
      } else {
        throw new Error(result.error || 'Falha ao enviar código de verificação');
      }
    } catch (error) {
      console.error('Erro ao enviar código de verificação:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro',
        description: errorMessage || 'Falha ao enviar código de verificação. Tente novamente.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Método para verificar código enviado para telefone/WhatsApp
  const handleVerifyPhoneCode = async (phone: string, code: string): Promise<User | null> => {
    try {
      setIsLoading(true);
      
      const result = await verifyPhoneCode(phone, code);
      
      if (result.success && result.user) {
        const convertedUser = convertApiUser(result.user);
        setUser(convertedUser);
        toast({
          title: 'Verificação concluída',
          description: 'Telefone verificado com sucesso.',
          variant: 'default'
        });
        return convertedUser;
      } else {
        throw new Error(result.error || 'Falha ao verificar código');
      }
    } catch (error) {
      console.error('Erro na verificação do código:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro de verificação',
        description: errorMessage || 'Código inválido ou expirado. Tente novamente.',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Método para atualizar perfil
  const updateProfile = async (profileData: Record<string, unknown>): Promise<boolean> => {
    // Implementar quando tivermos o endpoint de atualização de perfil
    return false;
  };

  // Valores do contexto
  const contextValue: AuthContextType = {
    user,
    session: null, // Não usamos mais o conceito de sessão do Supabase
    isLoading,
    isInitialized,
    isAuthenticated: !!user,
    signIn: async (email: string, password: string, rememberMe = false): Promise<any> => {
      try {
        const user = await handleLogin(email, password, rememberMe);
        if (user) {
          return { error: null };
        } else {
          return { error: { message: 'Falha ao fazer login' } };
        }
      } catch (error) {
        return { error: { message: error instanceof Error ? error.message : 'Erro desconhecido' } };
      }
    },
    signUp: handleRegister,
    signOut: handleLogout,
    hasRole,
    hasPermission,
    getRoleName,
    currentUser: user,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    handleLogin,
    handleRegister,
    handleLogout,
    showUserDropdown,
    setShowUserDropdown,
    updateProfile,
    handleSendPhoneVerification,
    handleVerifyPhoneCode,
    error: null // Adicionando a propriedade error que estava faltando
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
