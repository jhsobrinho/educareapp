
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useProfessionalChildren } from '@/hooks/useProfessionalChildren';
import { useCustomAuth as useAuth } from '@/hooks/useCustomAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Users, UserPlus, ClipboardList, FileText, 
  Clock, CheckCircle, XCircle, Loader2, MessageCircle
} from 'lucide-react';

const ProfessionalDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { childrenAccess, isLoading } = useProfessionalChildren();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('assigned');
  
  const assignedChildren = childrenAccess.filter(child => child.status === 'approved');
  const pendingInvitations = childrenAccess.filter(child => child.status === 'pending');
  
  return (
    <>
      <Helmet>
        <title>Dashboard Profissional | Educare</title>
      </Helmet>
      
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard Profissional</h1>
          <Button onClick={() => navigate('/educare-app/settings')} variant="outline">
            Atualizar Perfil
          </Button>
        </div>
        
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="pt-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-indigo-900">Bem-vindo, {user?.name || 'Profissional'}</h2>
              <p className="text-indigo-700">
                Como profissional, você pode acessar dados de crianças cujos responsáveis te convidaram para acompanhamento.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-blue-100 p-2 rounded-full mb-2">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="font-medium">Crianças</h3>
                    <span className="text-2xl font-bold text-blue-600">{assignedChildren.length}</span>
                    <p className="text-xs text-slate-600 mt-1">Sob seu acompanhamento</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-amber-100 p-2 rounded-full mb-2">
                      <Clock className="h-5 w-5 text-amber-600" />
                    </div>
                    <h3 className="font-medium">Convites</h3>
                    <span className="text-2xl font-bold text-amber-600">{pendingInvitations.length}</span>
                    <p className="text-xs text-slate-600 mt-1">Aguardando resposta</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-green-100 p-2 rounded-full mb-2">
                      <MessageCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="font-medium">Mensagens</h3>
                    <span className="text-2xl font-bold text-green-600">0</span>
                    <p className="text-xs text-slate-600 mt-1">Não lidas</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="assigned" onValueChange={setActiveTab} value={activeTab}>
          <TabsList>
            <TabsTrigger value="assigned">
              Crianças Atribuídas
              {assignedChildren.length > 0 && (
                <Badge className="ml-2 bg-blue-600">{assignedChildren.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="invitations">
              Convites
              {pendingInvitations.length > 0 && (
                <Badge className="ml-2 bg-amber-600">{pendingInvitations.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="assigned" className="space-y-4 mt-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : assignedChildren.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignedChildren.map((child) => (
                  <Card key={child.childId} className="overflow-hidden">
                    <CardHeader className="bg-blue-50 pb-2">
                      <CardTitle className="text-md font-medium">{child.childName}</CardTitle>
                      <CardDescription>
                        <Badge className="bg-green-600">Acompanhamento Ativo</Badge>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Associado em:</span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(child.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <div className="space-x-2 flex justify-end">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/educare-app/professional/child/${child.childId}/analysis`)}
                          >
                            <ClipboardList className="h-4 w-4 mr-1" />
                            Análises
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/educare-app/professional/child/${child.childId}/messages`)}
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Mensagens
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-slate-400 mb-2" />
                  <h3 className="text-lg font-medium mb-2">Nenhuma criança atribuída</h3>
                  <p className="text-sm text-slate-500 mb-6">
                    Você ainda não foi adicionado ao acompanhamento de nenhuma criança.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="invitations" className="space-y-4 mt-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : pendingInvitations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingInvitations.map((invite) => (
                  <Card key={invite.childId}>
                    <CardHeader className="bg-amber-50 pb-2">
                      <CardTitle className="text-md font-medium">{invite.childName}</CardTitle>
                      <CardDescription>
                        <Badge className="bg-amber-500">Convite Pendente</Badge>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Recebido em:</span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(invite.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-green-600 text-green-600 hover:bg-green-50"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aceitar
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline" 
                            className="border-red-600 text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Recusar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <UserPlus className="h-12 w-12 mx-auto text-slate-400 mb-2" />
                  <h3 className="text-lg font-medium mb-2">Nenhum convite pendente</h3>
                  <p className="text-sm text-slate-500">
                    Você não possui convites pendentes de responsáveis.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default ProfessionalDashboard;
