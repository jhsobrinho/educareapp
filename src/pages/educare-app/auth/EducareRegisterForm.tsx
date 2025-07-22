
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCustomAuth as useAuth } from '@/hooks/useCustomAuth';
import type { UserRole } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';
import { validateRegisterForm } from '@/utils/form-validation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

const EducareRegisterForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('parent');
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  const { handleRegister } = useAuth();
  const { toast } = useToast();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate inputs
      if (!validateRegisterForm(name, email, password, role, agreeTerms)) {
        setIsLoading(false);
        return;
      }

      await handleRegister(name, email, password, role, agreeTerms);
      
      // Set app-specific login flag
      localStorage.setItem('educareAppLoggedIn', 'true');
      
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Você já pode acessar o Educare App.",
      });
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao criar conta",
        description: "Não foi possível completar seu cadastro. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            type="text"
            placeholder="Nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        
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
        
        <div className="space-y-2">
          <Label htmlFor="role">Perfil</Label>
          <Select 
            value={role} 
            onValueChange={(value) => setRole(value as UserRole)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione seu perfil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="parent">Responsável (Mãe)</SelectItem>
              <SelectItem value="professional">Profissional</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            {role === 'parent' ? 
              'Como Responsável, você terá acesso aos dados do seu filho.' : 
              'Como Profissional, você poderá acompanhar múltiplas crianças e seus responsáveis.'}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="terms" 
            checked={agreeTerms}
            onCheckedChange={(checked) => setAgreeTerms(checked === true)}
          />
          <Label 
            htmlFor="terms" 
            className="text-sm text-gray-700"
          >
            Eu aceito os Termos de Uso e Política de Privacidade
          </Label>
        </div>
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cadastrando...
            </>
          ) : 'Cadastrar'}
        </Button>
      </div>
    </form>
  );
};

export default EducareRegisterForm;
