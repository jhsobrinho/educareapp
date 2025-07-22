
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

// Disabled hook since maternal_milestones table doesn't exist yet
export const useMaternalMilestones = (profileId?: string) => {
  const { toast } = useToast();

  // Return empty data and disabled functionality
  return {
    milestones: [],
    isLoading: false,
    addMilestone: async () => {
      toast({
        title: 'Funcionalidade em desenvolvimento',
        description: 'Esta funcionalidade será implementada em breve.',
        variant: 'default',
      });
    },
    isAdding: false,
  };
};
