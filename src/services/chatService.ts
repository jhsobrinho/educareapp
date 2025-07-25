import { httpClient } from '@/services/api/httpClient';

export interface ChatGroup {
  id: string;
  team_id: string;
  child_id?: string;
  name: string;
  description?: string;
  invite_code: string;
  is_active: boolean;
  settings: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  team?: {
    id: string;
    name: string;
    members?: Array<{
      id: string;
      teamId: string;
      userId: string;
      role: string;
      status: string;
      user?: {
        id: string;
        name: string;
        email: string;
        role: string;
      };
    }>;
  };
}

export interface ChatMessage {
  id: string;
  chat_group_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'parent' | 'professional' | 'ai_assistant';
  message_content: string;
  message_type: 'text' | 'file' | 'image' | 'ai_summary' | 'system';
  file_url?: string;
  file_name?: string;
  file_size?: number;
  reply_to_id?: string;
  is_edited: boolean;
  edited_at?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  is_ai_processed: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ChatParticipant {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    profiles: Array<{
      name: string;
      type: string;
      professional_specialty?: string;
      phone?: string;
    }>;
  };
}

export interface CreateChatGroupRequest {
  team_id: string;
  child_id?: string;
  name: string;
  description?: string;
}

export interface SendMessageRequest {
  message_content: string;
  message_type?: 'text' | 'file' | 'image' | 'ai_summary' | 'system';
  reply_to_id?: string;
}

export interface ChatMessagesResponse {
  messages: ChatMessage[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ChatGroupWithStats extends ChatGroup {
  stats: {
    messageCount: number;
    participantCount: number;
    lastMessage: {
      content: string;
      sender: string;
      sentAt: string;
    } | null;
  };
}

export interface AllChatsResponse {
  groups: ChatGroupWithStats[];
  total: number;
  summary: {
    totalGroups: number;
    totalMessages: number;
    totalParticipants: number;
  };
  meta: {
    userRole: string;
    hasGlobalAccess: boolean;
  };
}

class ChatService {
  private baseUrl = '/api/chat';

  // Criar grupo de chat
  async createChatGroup(data: CreateChatGroupRequest): Promise<ChatGroup> {
    const response = await httpClient.post(`${this.baseUrl}/groups`, data);
    // Backend retorna dados diretamente em response.data, não em response.data.data
    return response.data;
  }

  // Listar grupos de chat do usuário
  async getChatGroups(): Promise<ChatGroup[]> {
    const response = await httpClient.get(`${this.baseUrl}/groups`);
    return response.data;
  }

  // Buscar grupo de chat por ID
  async getChatGroupById(groupId: string): Promise<ChatGroup> {
    const response = await httpClient.get(`${this.baseUrl}/groups/${groupId}`);
    return response.data;
  }

  // Buscar mensagens do grupo
  async getChatMessages(
    groupId: string, 
    page: number = 1, 
    limit: number = 50
  ): Promise<ChatMessagesResponse> {
    const response = await httpClient.get(
      `${this.baseUrl}/groups/${groupId}/messages?page=${page}&limit=${limit}`
    );
    return response.data;
  }

  // Enviar mensagem
  async sendMessage(groupId: string, data: SendMessageRequest): Promise<ChatMessage> {
    const response = await httpClient.post(
      `${this.baseUrl}/groups/${groupId}/messages`, 
      data
    );
    return response.data;
  }

  // Buscar participantes do grupo
  async getChatParticipants(groupId: string): Promise<ChatParticipant[]> {
    const response = await httpClient.get(`${this.baseUrl}/groups/${groupId}/participants`);
    return response.data;
  }

  // Buscar ou criar grupo de chat para uma equipe
  async getOrCreateTeamChatGroup(teamId: string, childName?: string): Promise<ChatGroup> {
    try {
      // Primeiro, tentar buscar grupos existentes
      const groups = await this.getChatGroups();
      const existingGroup = groups.find(group => group.team_id === teamId);
      
      if (existingGroup) {
        return existingGroup;
      }

      // Se não encontrar, criar um novo grupo
      const groupName = childName 
        ? `Chat - Equipe Terapêutica (${childName})`
        : 'Chat - Equipe Terapêutica';

      return await this.createChatGroup({
        team_id: teamId,
        name: groupName,
        description: `Grupo de comunicação da equipe terapêutica${childName ? ` para ${childName}` : ''}`
      });
    } catch (error) {
      console.error('Erro ao buscar/criar grupo de chat:', error);
      throw error;
    }
  }

  // Listar todos os chats do sistema (apenas para owner)
  async getAllChatsForOwner(): Promise<AllChatsResponse> {
    const response = await httpClient.get(`${this.baseUrl}/admin/all-chats`);
    return response.data;
  }
}

export const chatService = new ChatService();
