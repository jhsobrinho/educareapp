
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
import { Loader2, CheckCircle, Mail, Phone } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PhoneVerification } from '@/components/auth/PhoneVerification';

// Define a specific type for the Educare app roles
type EducareUserRole = 'parent' | 'professional';

const formSchema = z.object({
  name: z.string().min(3, { message: 'Por favor, insira seu nome completo.' }),
  email: z.string().email({ message: 'Por favor, insira um e-mail válido.' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
  confirmPassword: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
  role: z.enum(['parent', 'professional']),
  agreeTerms: z.boolean().refine(val => val === true, {
    message: 'Você precisa concordar com os termos e política de privacidade.'
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

interface EducareRegisterFormProps {
  redirectPath?: string | null;
}

const EducareRegisterForm: React.FC<EducareRegisterFormProps> = ({ redirectPath }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'parent' as EducareUserRole,
      agreeTerms: false,
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      console.log('Attempting registration with:', { 
        email: data.email, 
        name: data.name, 
        role: data.role 
      });
      
      const { data: authData, error } = await signUp(data.email, data.password, { 
        name: data.name, 
        role: data.role,
        first_name: data.name.split(' ')[0] || data.name,
        last_name: data.name.split(' ').slice(1).join(' ') || ''
      });
      
      if (error) {
        console.error('Registration error:', error);
        let errorMessage = "Ocorreu um erro ao criar sua conta. Por favor, tente novamente.";
        
        if (error.message.includes('User already registered')) {
          errorMessage = "Este email já está cadastrado. Tente fazer login ou use outro email.";
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = "A senha deve ter pelo menos 6 caracteres.";
        } else if (error.message.includes('Invalid email')) {
          errorMessage = "Por favor, insira um email válido.";
        } else if (error.message.includes('signup is disabled')) {
          errorMessage = "O cadastro está temporariamente desabilitado. Tente novamente mais tarde.";
        }
        
        throw new Error(errorMessage);
      }
      
      // Check if user needs email confirmation
      if (authData?.user && !authData.user.email_confirmed_at) {
        setRegistrationSuccess(true);
        toast({
          title: "Cadastro realizado!",
          description: "Verifique seu email para confirmar sua conta antes de fazer login.",
        });
      } else {
        toast({
          title: "Cadastro realizado com sucesso!",
          description: "Sua conta foi criada. Você já pode acessar o Educare.",
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
        
        console.log('Redirecting after registration to:', finalRedirect);
        navigate(finalRedirect, { replace: true });
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      
      toast({
        variant: "destructive",
        title: "Erro ao criar conta",
        description: error.message || "Ocorreu um erro inesperado. Por favor, tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="space-y-4">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Cadastro realizado com sucesso!</p>
              <p>Enviamos um email de confirmação para <strong>{form.getValues('email')}</strong>.</p>
              <p>Por favor, verifique sua caixa de entrada e spam, e clique no link de confirmação antes de fazer login.</p>
            </div>
          </AlertDescription>
        </Alert>
        
        <Button 
          onClick={() => navigate('/educare-app/auth?action=login')} 
          className="w-full"
        >
          Ir para Login
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome completo</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Seu nome completo" 
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="seu@email.com" 
                        {...field} 
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
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
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar senha</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field} 
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Você é</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione seu perfil" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="parent">Pai/Mãe/Responsável</SelectItem>
                        <SelectItem value="professional">Profissional</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agreeTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal">
                        Concordo com os{' '}
                        <a href="#" className="text-primary hover:underline">
                          Termos de Serviço
                        </a>{' '}
                        e{' '}
                        <a href="#" className="text-primary hover:underline">
                          Política de Privacidade
                        </a>
                      </FormLabel>
                      <FormMessage />
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
                    Cadastrando...
                  </>
                ) : (
                  'Cadastrar'
                )}
              </Button>
            </form>
          </Form>

          {registrationSuccess && (
            <Alert className="bg-green-50 border-green-200 mt-4">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Cadastro realizado com sucesso! Verifique seu email para confirmar sua conta.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
        
        <TabsContent value="phone">
          <PhoneVerification 
            onSuccess={() => {
              toast({
                title: 'Cadastro bem-sucedido',
                description: 'Você foi cadastrado com sucesso via telefone',
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

export default EducareRegisterForm;
