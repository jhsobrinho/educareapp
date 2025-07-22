import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { Navigate } from 'react-router-dom';
import { dashboardService, type DashboardMetrics, type SubscriptionPlanMetrics } from '@/services/dashboardService';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Crown,
  TrendingUp,
  DollarSign,
  Users,
  CreditCard,
  Settings,
  Shield,
  BarChart3,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  Server,
  Globe
} from 'lucide-react';

interface OwnerMetrics {
  totalUsers: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  churnRate: number;
  newSignups: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  subscribers: number;
  revenue: number;
  growth: number;
}

const OwnerDashboard: React.FC = () => {
  const { user, hasRole } = useCustomAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [planMetrics, setPlanMetrics] = useState<SubscriptionPlanMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  // Verificar se o usuário tem permissão de owner
  useEffect(() => {
  // Carregar dados do dashboard
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [dashboardMetrics, subscriptionPlanMetrics] = await Promise.all([
          dashboardService.getDashboardMetrics(),
          dashboardService.getSubscriptionPlanMetrics()
        ]);
        
        setMetrics(dashboardMetrics);
        setPlanMetrics(subscriptionPlanMetrics);
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do dashboard.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (hasRole('owner')) {
      loadDashboardData();
    }
  }, [hasRole, toast]);

  // Redirect if not owner
  if (!hasRole('owner')) {
    return <Navigate to="/educare-app/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="h-5 w-5" />;
      case 'warning': return <AlertTriangle className="h-5 w-5" />;
      case 'critical': return <XCircle className="h-5 w-5" />;
      default: return <Clock className="h-5 w-5" />;
    }
  };

  return (
    <>
      <Helmet>
        <title>Owner Dashboard | EducareApp</title>
      </Helmet>
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Crown className="h-8 w-8 text-amber-600" />
            <div>
              <h1 className="text-3xl font-bold">Owner Dashboard</h1>
              <p className="text-gray-600">Gestão Global da Plataforma EducareApp</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              <Crown className="h-3 w-3 mr-1" />
              Proprietário
            </Badge>
            <div className={`flex items-center space-x-1 ${getHealthColor(metrics?.systemHealth || 'healthy')}`}>
              {getHealthIcon(metrics?.systemHealth || 'healthy')}
              <span className="text-sm font-medium">Sistema {metrics?.systemHealth === 'healthy' ? 'Saudável' : metrics?.systemHealth}</span>
            </div>
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{metrics?.totalUsers?.toLocaleString() || '0'}</div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-xs text-green-600 mt-1">+{metrics?.newUsersToday || 0} novos hoje</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Assinaturas Ativas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{metrics?.activeSubscriptions?.toLocaleString() || '0'}</div>
                <CreditCard className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-xs text-gray-600 mt-1">{metrics?.conversionRate?.toFixed(1) || '0'}% conversão</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Receita Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{formatCurrency(metrics?.monthlyRevenue || 0)}</div>
                <DollarSign className="h-8 w-8 text-emerald-500" />
              </div>
              <p className="text-xs text-green-600 mt-1">Receita ativa</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Taxa de Churn</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{metrics?.churnRate?.toFixed(1) || '0'}%</div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Último mês</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className={`text-2xl font-bold ${getHealthColor(metrics?.systemHealth || 'healthy')}`}>
                  {metrics?.systemHealth === 'healthy' ? '100%' : metrics?.systemHealth === 'warning' ? '85%' : '60%'}
                </div>
                <Activity className="h-8 w-8 text-purple-500" />
              </div>
              <p className="text-xs text-green-600 mt-1">Uptime {metrics?.uptime?.toFixed(1) || '0'}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Principais */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="system">Sistema</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Planos de Assinatura</CardTitle>
                  <CardDescription>Performance dos planos por receita</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {planMetrics.length > 0 ? (
                      planMetrics.map((plan, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium">{plan.planName}</h4>
                            <p className="text-sm text-muted-foreground">{plan.subscriberCount} assinantes</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">
                              R$ {plan.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className={`text-xs ${
                              plan.growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {plan.growthPercentage >= 0 ? '+' : ''}{plan.growthPercentage.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Nenhum plano encontrado</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ações Rápidas</CardTitle>
                  <CardDescription>Ferramentas de gestão da plataforma</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 grid-cols-2">
                    <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                      <Users className="h-6 w-6" />
                      <span className="text-sm">Gerenciar Usuários</span>
                    </Button>
                    <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                      <CreditCard className="h-6 w-6" />
                      <span className="text-sm">Planos & Preços</span>
                    </Button>
                    <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                      <BarChart3 className="h-6 w-6" />
                      <span className="text-sm">Relatórios</span>
                    </Button>
                    <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                      <Settings className="h-6 w-6" />
                      <span className="text-sm">Configurações</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Assinaturas */}
          <TabsContent value="subscriptions">
            <Card>
              <CardHeader>
                <CardTitle>Gestão de Assinaturas</CardTitle>
                <CardDescription>Controle detalhado dos planos e assinaturas</CardDescription>
              </CardHeader>
              <CardContent className="h-96 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <CreditCard className="h-12 w-12 mx-auto mb-4" />
                  <p className="text-lg font-medium">Gestão de Assinaturas</p>
                  <p className="text-sm">Implementar interface de gestão de planos e assinaturas</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Avançados</CardTitle>
                <CardDescription>Métricas detalhadas de negócio e uso</CardDescription>
              </CardHeader>
              <CardContent className="h-96 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                  <p className="text-lg font-medium">Analytics Avançados</p>
                  <p className="text-sm">Implementar dashboards de analytics (cohorts, LTV, CAC)</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sistema */}
          <TabsContent value="system">
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Status do Sistema</CardTitle>
                  <CardDescription>Monitoramento de infraestrutura</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Server className="h-4 w-4" />
                        <span>Servidor Backend</span>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Online
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Database className="h-4 w-4" />
                        <span>Banco de Dados</span>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Conectado
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4" />
                        <span>CDN</span>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Ativo
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Logs do Sistema</CardTitle>
                  <CardDescription>Últimas atividades críticas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Backup automático concluído - 15:30</span>
                    </div>
                    <div className="flex items-center space-x-2 text-blue-600">
                      <Activity className="h-4 w-4" />
                      <span>Deploy realizado com sucesso - 14:45</span>
                    </div>
                    <div className="flex items-center space-x-2 text-yellow-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Alta utilização de CPU detectada - 12:20</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Usuários */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Gestão de Usuários</CardTitle>
                <CardDescription>Controle avançado de usuários e permissões</CardDescription>
              </CardHeader>
              <CardContent className="h-96 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-4" />
                  <p className="text-lg font-medium">Gestão de Usuários</p>
                  <p className="text-sm">Implementar interface de gestão avançada de usuários</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configurações */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Globais</CardTitle>
                <CardDescription>Configurações de sistema e integrações</CardDescription>
              </CardHeader>
              <CardContent className="h-96 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Settings className="h-12 w-12 mx-auto mb-4" />
                  <p className="text-lg font-medium">Configurações do Sistema</p>
                  <p className="text-sm">Implementar painel de configurações globais</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default OwnerDashboard;
