import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageCircle, 
  Send, 
  UserPlus, 
  Users, 
  Bot,
  Calendar,
  Trash2,
  Copy,
  Paperclip,
  Image as ImageIcon,
  Smile,
  MoreVertical,
  Phone,
  Video,
  Settings,
  Search,
  Pin,
  Archive,
  VolumeX,
  Star
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useRealTeamChat, ChatMessage } from '@/hooks/useRealTeamChat';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { ChatNotifications } from './ChatNotifications';
import { ChatTypingIndicator } from './ChatTypingIndicator';
import { useChatTyping } from '@/hooks/useChatTyping';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface EnhancedTeamChatProps {
  childId: string;
  childName: string;
}

interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
}

export function EnhancedTeamChat({ childId, childName }: EnhancedTeamChatProps) {
  const {
    group,
    participants,
    messages,
    isLoading,
    createGroup,
    sendMessage,
    inviteParticipant,
    removeParticipant,
  } = useRealTeamChat(childId);

  const [newMessage, setNewMessage] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { sendPrompt: sendToAI } = useAIAssistant();
  const { user } = useCustomAuth();
  
  // Hook para gerenciar digitação em tempo real
  const {
    typingUsers,
    isTyping,
    startTyping,
    stopTyping
  } = useChatTyping({
    groupId: group?.id,
    currentUserId: user?.id,
    currentUserName: user?.name || 'Usuário',
    currentUserRole: user?.role || 'parent'
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleCreateGroup = async () => {
    console.log('🎯 handleCreateGroup chamado!');
    console.log('📊 Estado atual:', { childId, childName, isLoading, group });
    
    setIsCreatingGroup(true);
    const groupName = `Equipe Terapêutica - ${childName}`;
    console.log('📝 Criando grupo com nome:', groupName);
    
    try {
      const result = await createGroup(groupName);
      console.log('✅ Resultado da criação:', result);
    } catch (error) {
      console.error('❌ Erro ao criar grupo:', error);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    let messageContent = newMessage;
    
    // Se está respondendo a uma mensagem
    if (replyingTo) {
      messageContent = `@${replyingTo.sender_name}: ${messageContent}`;
    }

    const success = await sendMessage(messageContent);
    if (success) {
      setNewMessage('');
      setReplyingTo(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
      stopTyping();
    }
  };

  const handleInputChange = (value: string) => {
    setNewMessage(value);
    if (value.trim()) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  const handleInviteParticipant = async () => {
    if (!inviteEmail.trim()) return;

    const success = await inviteParticipant(inviteEmail);
    if (success) {
      setInviteEmail('');
      setIsInviteDialogOpen(false);
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Aqui você implementaria o upload do arquivo
    toast({
      title: "Upload de arquivo",
      description: "Funcionalidade de upload será implementada em breve.",
    });
  };

  const handleGenerateAISummary = async () => {
    if (!group || messages.length === 0) return;

    const recentMessages = messages.slice(-20).map(msg => 
      `${msg.sender_name} (${msg.sender_role}): ${msg.message_content}`
    ).join('\n');

    const prompt = `Analise as seguintes mensagens recentes do grupo de apoio terapêutico da criança ${childName} e forneça:

1. **Resumo das principais discussões**
2. **Insights sobre o desenvolvimento da criança**
3. **Recomendações para a equipe**
4. **Próximos passos sugeridos**

Mensagens:
${recentMessages}

Mantenha o resumo conciso, empático e focado em ações práticas.`;

    try {
      const response = await sendToAI(prompt, {
        systemMessage: `Você é um assistente especializado em desenvolvimento infantil que monitora conversas de grupos de apoio terapêutico. 
        Sua função é analisar as mensagens do grupo e fornecer resumos, insights e recomendações úteis para pais e profissionais.
        Foque em identificar padrões de desenvolvimento, preocupações dos pais, marcos importantes e sugestões de intervenção.
        Seja empático, claro e sempre baseie suas recomendações em evidências científicas.`,
        assistantType: 'titibot'
      });
      if (response?.response) {
        await sendMessage(`🤖 **Resumo AI Automático**\n\n${response.response}`, 'ai_summary');
      }
    } catch (error) {
      toast({
        title: "Erro ao gerar resumo",
        description: "Não foi possível gerar o resumo automático.",
        variant: "destructive",
      });
    }
  };

  const copyInviteCode = () => {
    if (group?.invite_code) {
      navigator.clipboard.writeText(group.invite_code);
      toast({
        title: "Código copiado!",
        description: "Código de convite copiado para a área de transferência.",
      });
    }
  };

  const getAvatarInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
      case 'parent':
        return 'bg-blue-500 text-white';
      case 'professional':
        return 'bg-green-500 text-white';
      case 'ai_assistant':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'parent':
        return 'Responsável';
      case 'professional':
        return 'Profissional';
      case 'ai_assistant':
        return 'IA';
      default:
        return 'Membro';
    }
  };

  const filteredMessages = messages.filter(message =>
    message.message_content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.sender_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const emojis = ['👍', '❤️', '😊', '😢', '😮', '😡', '🎉', '👏'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

if (!group) {
  return (
    <Card className="h-96">
      <CardContent className="flex flex-col items-center justify-center h-full">
        <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold text-center mb-2">Grupo de Comunicação</h3>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          {/* TODO: Verificar se usuário tem convite pendente */}
          Crie um grupo para facilitar a comunicação entre a família e os profissionais que acompanham o desenvolvimento de {childName}.
        </p>
        
        {/* TODO: Implementar lógica de convite pendente */}
        <div className="space-y-3">
          <Button 
            onClick={handleCreateGroup} 
            disabled={isCreatingGroup}
            className="bg-orange-500 hover:bg-orange-600 text-white w-full"
          >
            <Users className="h-4 w-4 mr-2" />
            {isCreatingGroup ? 'Criando...' : 'Criar Grupo'}
          </Button>
          
          {/* Placeholder para botão de aceitar convite */}
          <div className="text-xs text-muted-foreground text-center">
            🚧 Em breve: Opção para aceitar convites de equipe
          </div>
        </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notificações */}
      <ChatNotifications 
        childId={childId} 
        onNotificationClick={(notification) => {
          // Aqui você pode implementar ações específicas para cada tipo de notificação
          console.log('Notificação clicada:', notification);
        }} 
      />
      
      {/* Header do Chat */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                    <Users className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div>
                <h3 className="font-semibold text-lg">{group.group_name}</h3>
                <p className="text-sm text-muted-foreground">
                  {participants.length} participante{participants.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Chamada de voz</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Video className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Videochamada</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleGenerateAISummary}>
                    <Bot className="h-4 w-4 mr-2" />
                    Gerar Resumo AI
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={copyInviteCode}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Código de Convite
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Pin className="h-4 w-4 mr-2" />
                    Fixar Conversa
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <VolumeX className="h-4 w-4 mr-2" />
                    Silenciar
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Archive className="h-4 w-4 mr-2" />
                    Arquivar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Participantes */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Participantes ({participants.length})</CardTitle>
              <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Convidar Participante</DialogTitle>
                    <DialogDescription>
                      Digite o email do profissional ou responsável que deseja adicionar ao grupo.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="email@exemplo.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      type="email"
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleInviteParticipant}>
                        Convidar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={getRoleColor(participant.role)}>
                        {getAvatarInitials(
                          participant.profile 
                            ? `${participant.profile.first_name} ${participant.profile.last_name}`
                            : 'UN'
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {participant.profile 
                          ? `${participant.profile.first_name} ${participant.profile.last_name}`
                          : 'Usuário'
                        }
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {getRoleLabel(participant.role)}
                      </Badge>
                    </div>
                  </div>
                  {participant.role !== 'admin' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => removeParticipant(participant.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chat Principal */}
        <Card className="lg:col-span-3 h-[600px] flex flex-col">
          {/* Barra de Pesquisa */}
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar mensagens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleGenerateAISummary}
                disabled={messages.length === 0}
              >
                <Bot className="h-4 w-4 mr-1" />
                Resumo AI
              </Button>
            </div>
          </CardHeader>

          {/* Área de Mensagens */}
          <CardContent className="flex-1 flex flex-col pt-0">
            {/* Reply Preview */}
            {replyingTo && (
              <div className="bg-muted p-3 rounded-lg mb-3 border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Respondendo a {replyingTo.sender_name}</p>
                    <p className="text-sm truncate">{replyingTo.message_content}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setReplyingTo(null)}
                  >
                    ×
                  </Button>
                </div>
              </div>
            )}

            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {filteredMessages.map((message) => (
                  <div key={message.id} className="group">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarFallback className={getRoleColor(message.sender_role)}>
                          {message.sender_role === 'ai_assistant' ? 'AI' : getAvatarInitials(message.sender_name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{message.sender_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(message.sent_at), 'HH:mm')}
                          </span>
                          {message.message_type === 'ai_summary' && (
                            <Badge variant="secondary" className="text-xs">
                              <Bot className="h-3 w-3 mr-1" />
                              Resumo AI
                            </Badge>
                          )}
                        </div>
                        
                        <div className={cn(
                          "p-3 rounded-lg text-sm whitespace-pre-wrap",
                          message.message_type === 'ai_summary' 
                            ? 'bg-purple-50 border border-purple-200' 
                            : 'bg-muted'
                        )}>
                          {message.message_content}
                        </div>

                        {/* Ações da Mensagem */}
                        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setReplyingTo(message)}
                          >
                            Responder
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Star className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Indicador de Digitação */}
              <ChatTypingIndicator 
                typingUsers={typingUsers.map(user => ({
                  id: user.id,
                  name: user.name,
                  role: user.role
                }))}
                className="mx-4 mb-2"
              />
            </ScrollArea>
            
            <Separator className="my-3" />
            
            {/* Input de Mensagem */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Textarea
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={handleKeyPress}
                    onBlur={stopTyping}
                    className="min-h-[60px] resize-none pr-12"
                    rows={2}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute bottom-2 right-2"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,application/pdf,.doc,.docx"
                  />
                  <Button variant="outline" size="sm" onClick={handleFileUpload}>
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!newMessage.trim()}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="flex gap-1 p-2 bg-muted rounded-lg">
                  {emojis.map((emoji) => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setNewMessage(prev => prev + emoji);
                        setShowEmojiPicker(false);
                      }}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
