
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCustomAuth as useAuth } from '@/hooks/useCustomAuth';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EducareLoginForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  const { handleLogin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!email || !password) {
        toast({
          variant: "destructive",
          title: "Campos obrigatórios",
          description: "Email e senha são obrigatórios",
        });
        setIsLoading(false);
        return;
      }

      const user = await handleLogin(email, password, rememberMe);
      
      // Set app-specific login flag
      localStorage.setItem('educareAppLoggedIn', 'true');
      
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo(a) de volta, ${user.name || 'usuário'}!`,
      });
      
      // Redirect to dashboard
      navigate('/educare-app/dashboard');
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: "Email ou senha incorretos. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="remember-me" 
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
            />
            <Label 
              htmlFor="remember-me" 
              className="text-sm text-gray-700"
            >
              Lembrar-me
            </Label>
          </div>
          
          <Button variant="link" className="text-sm p-0 h-auto" onClick={() => navigate('/educare-app/auth/reset-password')}>
            Esqueceu a senha?
          </Button>
        </div>
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Entrando...
            </>
          ) : 'Entrar'}
        </Button>
      </div>
    </form>
  );
};

export default EducareLoginForm;
