
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  UserCheck, 
  FileBarChart,
  Calendar,
  Activity,
  CheckSquare,
} from 'lucide-react';
import { useCustomAuth as useAuth } from '@/hooks/useCustomAuth';
import { useUserManagement } from '@/hooks/useUserManagement';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { users } = useUserManagement();
  
  // Count users by role
  const userCounts = {
    total: users.length,
    parents: users.filter(u => u.role === 'parent').length,
    professionals: users.filter(u => ['teacher', 'therapist', 'specialist', 'psychologist'].includes(u.role)).length,
    admins: users.filter(u => u.role === 'admin').length,
  };
  
  return (
    <>
      <Helmet>
        <title>Dashboard Admin | Educare+</title>
      </Helmet>
      
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard Administrativo</h1>
          <div className="text-sm text-gray-500">
            Bem-vindo, <span className="font-medium text-amber-700">{user?.name || 'Admin'}</span>
          </div>
        </div>
        
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-500 mr-2" />
                <div className="text-2xl font-bold">{userCounts.total}</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Pais e Responsáveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <UserCheck className="h-8 w-8 text-green-500 mr-2" />
                <div className="text-2xl font-bold">{userCounts.parents}</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Profissionais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <FileBarChart className="h-8 w-8 text-purple-500 mr-2" />
                <div className="text-2xl font-bold">{userCounts.professionals}</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Administradores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-amber-500 mr-2" />
                <div className="text-2xl font-bold">{userCounts.admins}</div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Atividade Recente</CardTitle>
                <CardDescription>Últimas ações no sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 bg-slate-50 p-3 rounded-md">
                    <CheckSquare className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Novo usuário cadastrado</p>
                      <p className="text-sm text-gray-500">Maria Silva registrou-se como profissional</p>
                      <p className="text-xs text-gray-400 mt-1">Hoje, 10:45</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 bg-slate-50 p-3 rounded-md">
                    <Calendar className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Atualização de quiz</p>
                      <p className="text-sm text-gray-500">Novas questões adicionadas ao quiz de 2-3 anos</p>
                      <p className="text-xs text-gray-400 mt-1">Ontem, 15:30</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 bg-slate-50 p-3 rounded-md">
                    <Users className="h-5 w-5 text-purple-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Conexão de profissionais</p>
                      <p className="text-sm text-gray-500">Psicólogo João conectou-se a 3 crianças</p>
                      <p className="text-xs text-gray-400 mt-1">03/04/2025, 09:15</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Crianças Registradas</CardTitle>
                  <CardDescription>Total por mês</CardDescription>
                </CardHeader>
                <CardContent className="h-80 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <p className="mb-2">Gráfico de crescimento</p>
                    <p className="text-sm">[Dados de exemplo - implementar gráfico real]</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Quizzes Completados</CardTitle>
                  <CardDescription>Últimos 30 dias</CardDescription>
                </CardHeader>
                <CardContent className="h-80 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <p className="mb-2">Gráfico de atividade</p>
                    <p className="text-sm">[Dados de exemplo - implementar gráfico real]</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>Dados e estatísticas da plataforma</CardDescription>
              </CardHeader>
              <CardContent className="h-96 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <p>Implementar visualização de dados e analytics</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Relatórios</CardTitle>
                <CardDescription>Relatórios do sistema</CardDescription>
              </CardHeader>
              <CardContent className="h-96 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <p>Implementar sistema de relatórios</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default AdminDashboard;
