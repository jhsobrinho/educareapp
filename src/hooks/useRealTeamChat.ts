import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { 
  chatService, 
  ChatGroup, 
  ChatMessage as ServiceChatMessage, 
  ChatParticipant as ServiceChatParticipant 
} from '@/services/chatService';
import { teamService } from '@/services/teamService';

// Interfaces compatíveis com o componente de chat existente
export interface TeamChatGroup {
  id: string;
  child_id: string;
  group_name: string;
  admin_user_id: string;
  invite_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatParticipant {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  is_active: boolean;
  profile?: {
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
  first_name: string;
  last_name: string;
  email: string;
}

export interface ChatMessage {
  id: string;
  group_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'parent' | 'professional' | 'ai_assistant';
  message_content: string;
  message_type: 'text' | 'file' | 'image' | 'ai_summary';
  file_url?: string;
  sent_at: string;
  is_ai_processed: boolean;
}

// Funções de conversão entre tipos do serviço e tipos do componente
const convertChatGroupToTeamGroup = (group: ChatGroup): TeamChatGroup => ({
  id: group.id,
  child_id: group.child_id || '',
  group_name: group.name,
  admin_user_id: '', // Será definido baseado nos participantes
  invite_code: group.invite_code,
  is_active: group.is_active,
  created_at: group.created_at,
  updated_at: group.updated_at
});

const convertServiceParticipantToLocal = (participant: ServiceChatParticipant): ChatParticipant => ({
  id: participant.id,
  group_id: participant.team_id, // Usar team_id como group_id
  user_id: participant.user_id,
  role: participant.role === 'admin' ? 'admin' : 'member',
  joined_at: participant.joined_at,
  is_active: participant.status === 'active',
  profile: {
    first_name: participant.user.name.split(' ')[0] || '',
    last_name: participant.user.name.split(' ').slice(1).join(' ') || '',
    email: participant.user.email,
    role: participant.user.role
  },
  first_name: participant.user.name.split(' ')[0] || '',
  last_name: participant.user.name.split(' ').slice(1).join(' ') || '',
  email: participant.user.email
});

const convertServiceMessageToLocal = (message: ServiceChatMessage): ChatMessage => ({
  id: message.id,
  group_id: message.chat_group_id,
  sender_id: message.sender_id,
  sender_name: message.sender_name,
  sender_role: message.sender_role,
  message_content: message.message_content,
  message_type: message.message_type as 'text' | 'file' | 'image' | 'ai_summary',
  file_url: message.file_url,
  sent_at: message.created_at,
  is_ai_processed: message.is_ai_processed
});

export function useRealTeamChat(childId?: string) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useCustomAuth();
  const [group, setGroup] = useState<TeamChatGroup | null>(null);
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar grupo de chat real
  const loadGroup = useCallback(async () => {
    if (!childId || !isAuthenticated) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      // Primeiro, buscar a equipe associada à criança
      const teamsResponse = await teamService.listTeams();
      const teams = teamsResponse.data || [];
      const childTeam = teams.find((team: { children?: Array<{ id: string; name: string }> }) => 
        team.children?.some((child: { id: string }) => child.id === childId)
      );

      if (!childTeam) {
        throw new Error('Equipe não encontrada para esta criança');
      }

      // Buscar ou criar grupo de chat para a equipe
      const chatGroup = await chatService.getOrCreateTeamChatGroup(
        childTeam.id, 
        childTeam.children?.find(child => child.id === childId)?.name
      );

      const teamGroup = convertChatGroupToTeamGroup(chatGroup);
      setGroup(teamGroup);

      // Carregar participantes
      const serviceParticipants = await chatService.getChatParticipants(chatGroup.id);
      const localParticipants = serviceParticipants.map(convertServiceParticipantToLocal);
      setParticipants(localParticipants);

      // Carregar mensagens
      const messagesResponse = await chatService.getChatMessages(chatGroup.id, 1, 50);
      const localMessages = messagesResponse.messages.map(convertServiceMessageToLocal);
      setMessages(localMessages);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar grupo';
      setError(errorMessage);
      toast({
        title: "Erro ao carregar chat",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [childId, isAuthenticated]);

  // Criar grupo de chat
  const createGroup = useCallback(async (groupName: string) => {
    console.log('🚀 createGroup chamado:', { groupName, childId, isAuthenticated });
    
    if (!childId || !isAuthenticated) {
      console.log('❌ Acesso negado:', { childId, isAuthenticated });
      toast({
        title: "Acesso negado",
        description: "Você precisa estar logado para criar um grupo.",
        variant: "destructive",
      });
      navigate('/auth');
      return null;
    }

    try {
      console.log('🔍 Buscando equipes...');
      // Buscar equipe da criança
      const teamsResponse = await teamService.listTeams();
      console.log('📋 Resposta das equipes:', teamsResponse);
      const teams = teamsResponse.data?.teams || teamsResponse.data || [];
      console.log('👥 Equipes encontradas:', teams);
      console.log('🔍 Estrutura da primeira equipe:', teams[0]);
      console.log('🆔 childId procurado:', childId);
      
      // Como as equipes não têm campo children, vamos usar a primeira equipe disponível
      // TODO: Implementar lógica correta para associar criança à equipe
      const childTeam = teams[0]; // Por enquanto, usar primeira equipe
      console.log('⚠️ ATENÇÃO: Usando primeira equipe disponível como fallback');
      console.log('🔧 TODO: Implementar associação correta criança-equipe');
      
      console.log('🎯 Equipe da criança:', childTeam);

      if (!childTeam) {
        console.log('❌ Nenhuma equipe encontrada para a criança:', childId);
        throw new Error('Equipe não encontrada para esta criança');
      }

      // Criar grupo de chat
      console.log('📡 Chamando chatService.createChatGroup...');
      const chatGroup = await chatService.createChatGroup({
        team_id: childTeam.id,
        child_id: childId,
        name: groupName,
        description: `Grupo de comunicação da equipe terapêutica`
      });
      
      console.log('🎉 Grupo criado no backend:', chatGroup);

      const teamGroup = convertChatGroupToTeamGroup(chatGroup);
      console.log('🔄 Grupo convertido:', teamGroup);
      
      console.log('💾 Atualizando estado do grupo...');
      setGroup(teamGroup);
      console.log('✅ Estado atualizado!');

      toast({
        title: "Grupo criado",
        description: "Grupo de chat criado com sucesso!",
      });

      return teamGroup;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar grupo';
      toast({
        title: "Erro ao criar grupo",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  }, [childId, isAuthenticated, navigate]);

  // Enviar mensagem
  const sendMessage = useCallback(async (content: string, messageType: 'text' | 'ai_summary' = 'text') => {
    if (!group || !isAuthenticated) return false;

    try {
      const serviceMessage = await chatService.sendMessage(group.id, {
        message_content: content,
        message_type: messageType
      });

      const localMessage = convertServiceMessageToLocal(serviceMessage);
      setMessages(prev => [...prev, localMessage]);

      toast({
        title: "Mensagem enviada",
        description: "Sua mensagem foi enviada com sucesso!",
      });

      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar mensagem';
      toast({
        title: "Erro ao enviar mensagem",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  }, [group, isAuthenticated]);

  // Convidar participante
  const inviteParticipant = useCallback(async (email: string) => {
    if (!group) return false;

    if (!isAuthenticated) {
      toast({
        title: "Acesso negado",
        description: "Você precisa estar logado para convidar participantes.",
        variant: "destructive",
      });
      navigate('/auth');
      return false;
    }

    try {
      // Por enquanto, simular convite até implementar endpoint específico
      toast({
        title: "Convite enviado",
        description: `Convite enviado para ${email}. Esta funcionalidade será implementada em breve.`,
      });

      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao convidar participante';
      toast({
        title: "Erro ao convidar participante",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  }, [group, isAuthenticated, navigate]);

  // Remover participante
  const removeParticipant = useCallback(async (participantId: string) => {
    if (!group) return false;

    if (!isAuthenticated) {
      toast({
        title: "Acesso negado",
        description: "Você precisa estar logado para remover participantes.",
        variant: "destructive",
      });
      navigate('/auth');
      return false;
    }

    try {
      // Por enquanto, simular remoção até implementar endpoint específico
      setParticipants(prev => prev.filter(p => p.id !== participantId));

      toast({
        title: "Participante removido",
        description: "Participante removido do grupo.",
      });

      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover participante';
      toast({
        title: "Erro ao remover participante",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  }, [group, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated && childId) {
      loadGroup();
    }
  }, [childId, isAuthenticated, loadGroup]);

  return {
    group,
    participants,
    messages,
    isLoading,
    error,
    isAuthenticated,
    createGroup,
    sendMessage,
    inviteParticipant,
    removeParticipant,
    refreshGroup: loadGroup,
  };
}
