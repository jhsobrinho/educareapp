
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { differenceInYears } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { childFormSchema, ChildFormValues } from '@/schema/educare-app/childFormSchema';
import { useCustomAuth as useAuth } from '@/hooks/useCustomAuth';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isValidBirthdate } from '@/utils/educare-app/calculateAge';

export const useChildForm = (id?: string) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditMode = !!id;
  
  // Initialize the form with Zod validation
  const form = useForm<ChildFormValues>({
    resolver: zodResolver(childFormSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      birthDate: new Date().toISOString().split('T')[0],
      gender: 'male',
      cpf: '',
      nationality: '',
      city: '',
      bloodtype: undefined,
      observations: '',
    },
    mode: 'onChange'
  });

  // Track form changes to set isDirty state
  useEffect(() => {
    const subscription = form.watch(() => {
      setIsDirty(form.formState.isDirty);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Function to load child data
  const loadChildData = async () => {
    if (!user || !id) return;

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Loading child data for ID:', id);
      
      const { data, error } = await supabase
        .from('educare_children')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading child data:', error);
        throw error;
      }

      if (data) {
        console.log('Child data loaded:', data);
        
        const birthDate = new Date(data.birthdate);
        const formattedDate = birthDate.toISOString().split('T')[0];
        const gender = data.gender || 'male';
        const bloodtypeValue = data.bloodtype as 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | undefined;

        // Set the form values
        form.reset({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          birthDate: formattedDate,
          gender: gender as 'male' | 'female' | 'other',
          cpf: data.cpf || '',
          nationality: data.nationality || '',
          city: data.city || '',
          bloodtype: bloodtypeValue,
          observations: data.observations || '',
        });
        
        setIsDirty(false);
      }
    } catch (error: any) {
      console.error('Error loading child data:', error);
      const errorMessage = 'Não foi possível carregar os dados da criança';
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load child data on component mount if in edit mode
  useEffect(() => {
    if (isEditMode) {
      loadChildData();
    }
  }, [id, user]);

  // Function to save child data
  const saveChildData = async (data: ChildFormValues) => {
    if (!user) {
      toast({
        title: 'Erro de autenticação',
        description: 'Você precisa estar logado para salvar',
        variant: 'destructive',
      });
      return false;
    }

    // Validate birthdate
    if (!isValidBirthdate(data.birthDate)) {
      setError('Data de nascimento inválida ou no futuro');
      toast({
        title: 'Data inválida',
        description: 'A data de nascimento não pode ser no futuro',
        variant: 'destructive',
      });
      return false;
    }
    
    setError(null);
    
    try {
      console.log('Saving child data:', data);
      
      // Calculate age based on birthdate
      const birthDate = new Date(data.birthDate);
      const age = differenceInYears(new Date(), birthDate);
      
      // Prepare the data object for both insert and update operations
      const childData = {
        first_name: data.first_name,
        last_name: data.last_name,
        birthdate: data.birthDate,
        age,
        gender: data.gender,
        cpf: data.cpf || null,
        nationality: data.nationality || null,
        city: data.city || null,
        bloodtype: data.bloodtype || null,
        observations: data.observations || null,
        user_id: user.id,
        name: `${data.first_name} ${data.last_name}`.trim()
      };

      if (id) {
        // Update existing child - preserve journey_progress
        const { data: existingData } = await supabase
          .from('educare_children')
          .select('journey_progress')
          .eq('id', id)
          .single();
          
        const { error } = await supabase
          .from('educare_children')
          .update({
            ...childData,
            journey_progress: existingData?.journey_progress ?? 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (error) throw error;
        
        toast({
          title: 'Sucesso',
          description: 'Dados atualizados com sucesso',
        });
      } else {
        // Create new child
        const { error, data: newChild } = await supabase
          .from('educare_children')
          .insert({
            ...childData,
            journey_progress: 0,
          })
          .select('id')
          .single();

        if (error) throw error;
        
        toast({
          title: 'Sucesso',
          description: 'Criança cadastrada com sucesso',
        });
        
        if (newChild?.id) {
          localStorage.setItem('educare_last_selected_child', newChild.id);
        }
      }
      
      setIsDirty(false);
      return true;
    } catch (error: any) {
      console.error('Error saving child data:', error);
      const errorMessage = error.message || 'Não foi possível salvar os dados';
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }
  };

  // Form submission handler
  const onSubmit = async (values: ChildFormValues) => {
    console.log('Form submission:', values);
    setIsLoading(true);
    
    try {
      const success = await saveChildData(values);
      if (success) {
        navigate('/educare-app/children');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Delete handler
  const onDelete = async () => {
    if (!user || !id) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('educare_children')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Criança removida com sucesso',
      });
      
      navigate('/educare-app/children');
    } catch (error: any) {
      console.error('Error deleting child:', error);
      const errorMessage = error.message || 'Não foi possível remover a criança';
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    isLoading,
    isEditMode,
    isDirty,
    error,
    loadChildData,
    saveChildData,
    onSubmit,
    onDelete,
  };
};
