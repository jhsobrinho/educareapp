
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useCustomAuth as useAuth } from '@/hooks/useCustomAuth';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, AlertCircle, Mail, Phone } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PhoneVerification } from '@/components/auth/PhoneVerification';

// Função para validar telefone internacional
const isValidPhone = (value: string) => {
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  return phoneRegex.test(value);
};

const formSchema = z.object({
  loginIdentifier: z.string().min(1, { message: 'Por favor, insira seu email ou telefone.' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
  rememberMe: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface EducareLoginFormProps {
  redirectPath?: string | null;
}

const EducareLoginForm: React.FC<EducareLoginFormProps> = ({ redirectPath }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailConfirmationAlert, setShowEmailConfirmationAlert] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      loginIdentifier: '',
      password: '',
      rememberMe: false,
    },
  });

  const { signUp } = useAuth();
  
  const handleResendConfirmation = async () => {
    const loginIdentifier = form.getValues('loginIdentifier');
    if (!loginIdentifier) {
      toast({
        variant: "destructive",
        title: "Email ou telefone necessário",
        description: "Por favor, insira seu email ou telefone para reenviar a confirmação.",
      });
      return;
    }

    // Verificar se é email ou telefone
    const isEmail = loginIdentifier.includes('@');
    
    if (!isEmail) {
      toast({
        variant: "destructive",
        title: "Email necessário",
        description: "Para reenviar a confirmação, é necessário usar o email.",
      });
      return;
    }

    try {
      const { error } = await signUp(loginIdentifier, 'temp', { resend: true });
      if (!error) {
        toast({
          title: "Email de confirmação reenviado",
          description: "Verifique sua caixa de entrada e spam.",
        });
      }
    } catch (error) {
      console.error('Error resending confirmation:', error);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setShowEmailConfirmationAlert(false);
    
    try {
      console.log('Attempting login with:', data.loginIdentifier);
      const { error } = await signIn(data.loginIdentifier, data.password);
      
      if (error) {
        console.error('Login error:', error);
        
        // Handle specific error cases
        if (error.message.includes('Email not confirmed')) {
          setShowEmailConfirmationAlert(true);
          toast({
            variant: "destructive",
            title: "Email não confirmado",
            description: "Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.",
          });
          return;
        }

        let errorMessage = "Email ou senha incorretos. Por favor, tente novamente.";
        
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = "Credenciais inválidas. Verifique seu email e senha.";
        } else if (error.message.includes('Too many requests')) {
          errorMessage = "Muitas tentativas de login. Tente novamente em alguns minutos.";
        } else if (error.message.includes('User not found')) {
          errorMessage = "Usuário não encontrado. Verifique seu email ou cadastre-se.";
        }
        
        throw new Error(errorMessage);
      }
      
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao Educare.",
      });
      
      // Safe redirect path handling
      let finalRedirect = '/educare-app/dashboard';
      
      if (redirectPath) {
        // Validate redirect path is safe
        if (redirectPath.startsWith('/educare-app/') && 
            !redirectPath.includes('/auth') &&
            redirectPath.length < 100 &&
            !redirectPath.includes('%')) {
          finalRedirect = redirectPath;
        }
      }
      
      console.log('Redirecting after login to:', finalRedirect);
      navigate(finalRedirect, { replace: true });
    } catch (error: any) {
      console.error('Login error:', error);
      
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: error.message || "Ocorreu um erro inesperado. Por favor, tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {showEmailConfirmationAlert && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Email não confirmado. Por favor, verifique sua caixa de entrada e spam.
            <Button 
              variant="link" 
              className="p-0 h-auto font-semibold ml-1" 
              onClick={handleResendConfirmation}
            >
              Reenviar email de confirmação
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Telefone
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="email">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="loginIdentifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="seu@email.com" 
                        {...field} 
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Senha</FormLabel>
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-xs" 
                        type="button"
                        onClick={() => navigate('/educare-app/auth/reset-password')}
                      >
                        Esqueceu a senha?
                      </Button>
                    </div>
                    <FormControl>
                      <Input 
                        type="password" 
                        {...field} 
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Lembrar de mim
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          </Form>
        </TabsContent>
        
        <TabsContent value="phone">
          <PhoneVerification 
            onSuccess={() => {
              toast({
                title: 'Login bem-sucedido',
                description: 'Você foi conectado com sucesso via telefone',
              });
              
              // Safe redirect path handling
              let finalRedirect = '/educare-app/dashboard';
              
              if (redirectPath) {
                // Validate redirect path is safe
                if (redirectPath.startsWith('/educare-app/') && 
                    !redirectPath.includes('/auth') &&
                    redirectPath.length < 100 &&
                    !redirectPath.includes('%')) {
                  finalRedirect = redirectPath;
                }
              }
              
              navigate(finalRedirect, { replace: true });
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EducareLoginForm;
