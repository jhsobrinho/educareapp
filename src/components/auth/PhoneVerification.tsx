import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/components/ui/use-toast';
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
import { useCustomAuth } from '@/hooks/useCustomAuth';

// Esquema de validação para o formulário de telefone
const phoneFormSchema = z.object({
  phone: z
    .string()
    .min(10, { message: 'Telefone deve ter pelo menos 10 dígitos' })
    .max(15, { message: 'Telefone deve ter no máximo 15 dígitos' })
    .regex(/^\+?[0-9]+$/, { message: 'Formato de telefone inválido' }),
});

// Esquema de validação para o formulário de código
const codeFormSchema = z.object({
  code: z
    .string()
    .length(6, { message: 'O código deve ter 6 dígitos' })
    .regex(/^[0-9]+$/, { message: 'O código deve conter apenas números' }),
});

type PhoneFormValues = z.infer<typeof phoneFormSchema>;
type CodeFormValues = z.infer<typeof codeFormSchema>;

interface PhoneVerificationProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PhoneVerification({ onSuccess, onCancel }: PhoneVerificationProps) {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const { handleSendPhoneVerification, handleVerifyPhoneCode } = useCustomAuth();
  const { toast } = useToast();

  // Formulário para o número de telefone
  const phoneForm = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneFormSchema),
    defaultValues: {
      phone: '',
    },
  });

  // Formulário para o código de verificação
  const codeForm = useForm<CodeFormValues>({
    resolver: zodResolver(codeFormSchema),
    defaultValues: {
      code: '',
    },
  });

  // Função para enviar o número de telefone
  const onPhoneSubmit = async (data: PhoneFormValues) => {
    try {
      const formattedPhone = data.phone.startsWith('+') ? data.phone : `+${data.phone}`;
      const result = await handleSendPhoneVerification(formattedPhone);
      
      if (result) {
        setPhoneNumber(formattedPhone);
        setStep('code');
        toast({
          title: 'Código enviado',
          description: 'Um código de verificação foi enviado para o seu telefone.',
        });
      }
    } catch (error) {
      console.error('Erro ao enviar código:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar o código de verificação. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  // Função para verificar o código
  const onCodeSubmit = async (data: CodeFormValues) => {
    try {
      const result = await handleVerifyPhoneCode(phoneNumber, data.code);
      
      if (result) {
        toast({
          title: 'Sucesso',
          description: 'Telefone verificado com sucesso!',
        });
        
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Erro ao verificar código:', error);
      toast({
        title: 'Erro',
        description: 'Código inválido ou expirado. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  // Função para voltar para a etapa de telefone
  const handleBack = () => {
    setStep('phone');
  };

  // Função para reenviar o código
  const handleResendCode = async () => {
    try {
      const result = await handleSendPhoneVerification(phoneNumber);
      
      if (result) {
        toast({
          title: 'Código reenviado',
          description: 'Um novo código de verificação foi enviado para o seu telefone.',
        });
      }
    } catch (error) {
      console.error('Erro ao reenviar código:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível reenviar o código de verificação. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {step === 'phone' ? 'Verificação de Telefone' : 'Digite o Código'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {step === 'phone'
            ? 'Digite seu número de telefone para receber um código de verificação'
            : `Um código de 6 dígitos foi enviado para ${phoneNumber}`}
        </p>
      </div>

      {step === 'phone' ? (
        <Form {...phoneForm}>
          <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
            <FormField
              control={phoneForm.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+5511999999999"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-between">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancelar
                </Button>
              )}
              <Button type="submit">Enviar Código</Button>
            </div>
          </form>
        </Form>
      ) : (
        <Form {...codeForm}>
          <form onSubmit={codeForm.handleSubmit(onCodeSubmit)} className="space-y-4">
            <FormField
              control={codeForm.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código de Verificação</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="123456"
                      maxLength={6}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={handleBack}>
                Voltar
              </Button>
              <Button type="submit">Verificar</Button>
            </div>
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                className="text-xs"
                onClick={handleResendCode}
              >
                Reenviar código
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
