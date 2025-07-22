
import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Baby, 
  Bot,
  Calendar,
  BookOpen, 
  Settings
} from 'lucide-react';
import { useCustomAuth as useAuth } from '@/hooks/useCustomAuth';

const NavItem = ({ to, icon: Icon, label, active }: { to: string; icon: any; label: string; active?: boolean }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center space-x-3 px-4 py-3 rounded-md text-sm transition-colors",
          isActive || active
            ? "bg-primary/10 text-primary font-medium"
            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
        )
      }
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </NavLink>
  );
};

const ParentSidebar: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b dark:border-slate-700">
        <Link to="/" className="flex items-center space-x-2">
          <span className="font-display font-bold text-xl bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
            Educare+
          </span>
        </Link>
      </div>
      
      {/* User profile info */}
      {user && (
        <div className="px-4 py-3 border-b dark:border-slate-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </div>
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{user.name || user.email}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Responsável</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Navigation - Simplified core features */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <NavItem to="/educare-app/dashboard" icon={Home} label="Dashboard" />
        <NavItem to="/educare-app/children" icon={Baby} label="Crianças" />
        <NavItem to="/educare-app/journey-bot" icon={Bot} label="TitiNauta" />
        <NavItem to="/educare-app/activities" icon={Calendar} label="Atividades" />
        <NavItem to="/educare-app/material-apoio" icon={BookOpen} label="Material de Apoio" />
        <NavItem to="/educare-app/settings" icon={Settings} label="Configurações" />
      </nav>
    </div>
  );
};

export default ParentSidebar;
