
import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useCustomAuth as useAuth } from '@/hooks/useCustomAuth';
import { 
  Home, 
  Baby, 
  Bot,
  Calendar,
  Settings,
  User,
  Users,
  CreditCard,
  Crown,
  Shield,
  GraduationCap,
  UserCheck,
  MessageCircle,
  UsersRound
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

// Função para obter itens de navegação baseado no role do usuário
const getNavigationItems = (userRole?: string) => {
  const baseItems = [
    {
      title: "Dashboard",
      url: "/educare-app/dashboard",
      icon: Home,
    },
    {
      title: "Crianças",
      url: "/educare-app/children",
      icon: Baby,
    },
    {
      title: "TitiNauta",
      url: "/educare-app/journey-bot",
      icon: Bot,
    },
    {
      title: "Atividades",
      url: "/educare-app/activities",
      icon: Calendar,
    },
    {
      title: "Configurações",
      url: "/educare-app/settings",
      icon: Settings,
    },
  ];

  // Adicionar itens específicos para owner
  if (userRole === 'owner') {
    return [
      {
        title: "Dashboard Owner",
        url: "/educare-app/owner/dashboard",
        icon: Crown,
      },
      {
        title: "Gestão de Usuários",
        url: "/educare-app/owner/users",
        icon: Users,
      },
      {
        title: "Gestão de Profissionais",
        url: "/educare-app/owner/professionals",
        icon: GraduationCap,
      },
      {
        title: "Gestão de Equipes",
        url: "/educare-app/owner/teams",
        icon: UserCheck,
      },
      {
        title: "Gestão de Crianças",
        url: "/educare-app/owner/children",
        icon: UsersRound,
      },
      {
        title: "Gestão de Chats",
        url: "/educare-app/owner/chats",
        icon: MessageCircle,
      },
      {
        title: "Gestão de Planos",
        url: "/educare-app/owner/plans",
        icon: CreditCard,
      },
      ...baseItems,
    ];
  }

  // Adicionar itens específicos para admin
  if (userRole === 'admin') {
    return [
      {
        title: "Dashboard Admin",
        url: "/educare-app/admin/dashboard",
        icon: Shield,
      },
      {
        title: "Gestão de Usuários",
        url: "/educare-app/admin/users",
        icon: Users,
      },
      {
        title: "Gestão de Profissionais",
        url: "/educare-app/admin/professionals",
        icon: GraduationCap,
      },
      {
        title: "Gestão de Equipes",
        url: "/educare-app/admin/teams",
        icon: UserCheck,
      },
      {
        title: "Gestão de Crianças",
        url: "/educare-app/admin/children",
        icon: UsersRound,
      },
      {
        title: "Gestão de Planos",
        url: "/educare-app/admin/plans",
        icon: CreditCard,
      },
      ...baseItems,
    ];
  }

  // Adicionar itens específicos para profissional
  if (userRole === 'professional') {
    return [
      {
        title: "Dashboard Profissional",
        url: "/educare-app/professional/dashboard",
        icon: GraduationCap,
      },
      {
        title: "Gestão de Crianças",
        url: "/educare-app/professional/children",
        icon: UsersRound,
      },
      {
        title: "Configurações",
        url: "/educare-app/settings",
        icon: Settings,
      },
    ];
  }

  return baseItems;
};

export function EnhancedAppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, signOut } = useAuth();
  const { state } = useSidebar();
  
  // Obter itens de navegação baseado no role do usuário
  const navigationItems = getNavigationItems(user?.role);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Link to="/educare-app/dashboard" className="flex items-center space-x-2">
          {state === "expanded" ? (
            <span className="font-display font-bold text-xl bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
              Educare+
            </span>
          ) : (
            <span className="font-display font-bold text-xl text-primary">E+</span>
          )}
        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""
                      }
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        {user && (
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center space-x-2 p-2">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <User className="h-4 w-4" />
                  </div>
                </div>
                {state === "expanded" && (
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{user.name || user.email}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.role === 'parent' ? 'Responsável' : 'Profissional'}
                    </p>
                  </div>
                )}
              </div>
            </SidebarMenuItem>
            {state === "expanded" && (
              <SidebarMenuItem>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={signOut}
                  className="w-full justify-start text-sm"
                >
                  Sair
                </Button>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        )}
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  );
}
