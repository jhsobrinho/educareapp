import React, { useState, useCallback } from 'react';
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
import { Loader2, CheckCircle, Mail, Phone, CreditCard } from 'lucide-react';
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
import { subscriptionPlansService, type SubscriptionPlan } from '@/services/subscriptionPlansService';

// Define a specific type for the Educare app roles
type EducareUserRole = 'parent' | 'professional';

const formSchema = z.object({
  name: z.string().min(3, { message: 'Por favor, insira seu nome completo.' }),
  email: z.string().email({ message: 'Por favor, insira um e-mail válido.' }),
  phone: z.string().min(10, { message: 'Por favor, insira um telefone válido.' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
  confirmPassword: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
  role: z.enum(['parent', 'professional']),
  selectedPlan: z.string().min(1, { message: 'Por favor, selecione um plano de assinatura.' }),
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
  const { signUp, handleRegister } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [plansLoaded, setPlansLoaded] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      role: 'parent' as EducareUserRole,
      selectedPlan: '',
      agreeTerms: false,
    },
  });

  // Função para carregar planos apenas uma vez
  const loadPlans = useCallback(async () => {
    if (plansLoaded || loadingPlans) return;
    
    try {
      console.log('Carregando planos - única execução');
      setLoadingPlans(true);
      
      const plans = await subscriptionPlansService.getPublicPlans();
      setAvailablePlans(plans);
      setPlansLoaded(true);
      
      // Selecionar primeiro plano automaticamente
      if (plans.length > 0 && !form.getValues('selectedPlan')) {
        form.setValue('selectedPlan', plans[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar planos",
        description: "Não foi possível carregar os planos disponíveis.",
      });
    } finally {
      setLoadingPlans(false);
    }
  }, [plansLoaded, loadingPlans, form, toast]);

  // Carregar planos quando o componente for montado
  React.useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      console.log('Attempting registration with:', { 
        email: data.email, 
        name: data.name, 
        phone: data.phone,
        role: data.role,
        selectedPlan: data.selectedPlan
      });
      
      // Usar handleRegister em vez de signUp para incluir todos os parâmetros
      const authResult = await handleRegister(
        data.name,
        data.email, 
        data.password,
        data.role,
        data.agreeTerms,
        data.phone,
        data.selectedPlan
      );
      
      if (authResult) {
        console.log('Registration successful:', authResult);
        setRegistrationSuccess(true);
        toast({
          title: "Cadastro realizado com sucesso!",
          description: "Bem-vindo ao EducareApp!",
        });
        
        // Redirecionar para a página de login após um breve delay
        setTimeout(() => {
          navigate('/educare-app/auth?action=login');
        }, 2000);
      }
    } catch (error: unknown) {
      console.error('Registration failed:', error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao criar conta. Tente novamente.";
      toast({
        variant: "destructive",
        title: "Erro no cadastro",
        description: errorMessage,
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
              <p className="text-sm text-muted-foreground">
                Bem-vindo ao EducareApp! Você será redirecionado em instantes.
              </p>
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

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Phone className="inline w-4 h-4 mr-1" />
                      Telefone/WhatsApp *
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="tel" 
                        placeholder="(11) 99999-9999" 
                        {...field} 
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-gray-500">
                      Usado para comunicação e suporte via WhatsApp
                    </p>
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
                name="selectedPlan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <CreditCard className="inline w-4 h-4 mr-1" />
                      Plano de Assinatura *
                    </FormLabel>
                    {loadingPlans ? (
                      <div className="flex items-center justify-center p-4 border rounded-md">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Carregando planos...
                      </div>
                    ) : (
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um plano" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availablePlans.map((plan) => (
                            <SelectItem key={plan.id} value={plan.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{plan.name}</span>
                                <span className="text-sm text-gray-500">
                                  R$ {Number(plan.price).toFixed(2)}/{plan.billing_cycle === 'monthly' ? 'mês' : 'ano'}
                                  {plan.trial_days > 0 && ` • ${plan.trial_days} dias grátis`}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                    {field.value && availablePlans.length > 0 && (
                      <div className="p-3 bg-blue-50 rounded-md">
                        {(() => {
                          const plan = availablePlans.find(p => p.id === field.value);
                          return plan ? (
                            <div>
                              <p className="text-sm font-medium text-blue-900">{plan.name}</p>
                              <p className="text-xs text-blue-700 mt-1">{plan.description}</p>
                              {plan.trial_days > 0 && (
                                <p className="text-xs text-green-600 mt-1">
                                  ✨ Teste grátis por {plan.trial_days} dias
                                </p>
                              )}
                            </div>
                          ) : null;
                        })()
                        }
                      </div>
                    )}
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
