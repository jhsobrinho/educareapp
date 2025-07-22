import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCustomAuth as useAuth } from '@/hooks/useCustomAuth';

export const useDashboardMetrics = () => {
  const { user } = useAuth();
  const isParent = user?.role === 'parent';
  const isProfessional = user?.role === 'professional';

  // Fetch comprehensive children data with sessions and reports
  const { data: childrenMetrics, isLoading, error } = useQuery({
    queryKey: ['dashboard-metrics', user?.id, user?.role],
    queryFn: async () => {
      if (!user?.id) return null;

      if (isParent) {
        // Fetch children with their sessions and reports
        const { data: children, error: childrenError } = await supabase
          .from('educare_children')
          .select('*')
          .eq('user_id', user.id);

        if (childrenError) throw childrenError;

        // Fetch all sessions for these children
        const childIds = children?.map(c => c.id) || [];
        const { data: sessions, error: sessionsError } = await supabase
          .from('journey_bot_sessions')
          .select('*')
          .in('child_id', childIds);

        if (sessionsError) throw sessionsError;

        // Fetch all responses for these children
        const { data: responses, error: responsesError } = await supabase
          .from('journey_bot_responses')
          .select('*')
          .in('child_id', childIds);

        if (responsesError) throw responsesError;

        return {
          children: children || [],
          sessions: sessions || [],
          responses: responses || [],
          reports: []
        };
      } else if (isProfessional) {
        // Fetch professional children relationships
        const { data: professionalChildren, error: profError } = await supabase
          .from('educare_professional_children')
          .select('*')
          .eq('professional_id', user.id)
          .eq('status', 'approved');

        if (profError) throw profError;

        // Fetch the actual children data
        const childIds = professionalChildren?.map(pc => pc.child_id) || [];
        const { data: children, error: childrenError } = await supabase
          .from('educare_children')
          .select('*')
          .in('id', childIds);

        if (childrenError) throw childrenError;

        // Fetch sessions for professional's children
        const { data: sessions, error: sessionsError } = await supabase
          .from('journey_bot_sessions')
          .select('*')
          .in('child_id', childIds);

        if (sessionsError) throw sessionsError;

        return {
          children: children || [],
          sessions: sessions || [],
          responses: [],
          reports: [],
          professionalRelations: professionalChildren || []
        };
      }

      return null;
    },
    enabled: !!user?.id,
    staleTime: 0, // Always refetch to get latest progress data
    gcTime: 1000 * 60 * 5, // Keep cache for 5 minutes
  });

  // Calculate age-based progress for each child
  const calculateAgeBasedProgress = async (child: any, responses: any[]) => {
    const childAgeMonths = child.age;
    
    // Fetch age-appropriate questions for this child
    const { data: ageAppropriateQuestions } = await supabase
      .from('journey_bot_questions')
      .select('*')
      .lte('age_min_months', childAgeMonths)
      .gte('age_max_months', childAgeMonths)
      .eq('active', true);

    const totalAgeAppropriateQuestions = ageAppropriateQuestions?.length || 0;
    
    // Filter child responses to only include age-appropriate questions
    const childResponses = responses.filter(r => r.child_id === child.id);
    const ageAppropriateResponses = childResponses.filter(response => {
      return ageAppropriateQuestions?.some(q => q.id === response.question_id);
    });

    // Calculate progress by dimension
    const dimensionProgress: Record<string, { answered: number; total: number; percentage: number }> = {};
    
    if (ageAppropriateQuestions) {
      ageAppropriateQuestions.forEach(question => {
        const dimension = question.dimension;
        if (!dimensionProgress[dimension]) {
          dimensionProgress[dimension] = { answered: 0, total: 0, percentage: 0 };
        }
        dimensionProgress[dimension].total++;
        
        const hasResponse = ageAppropriateResponses.some(r => r.question_id === question.id);
        if (hasResponse) {
          dimensionProgress[dimension].answered++;
        }
      });

      // Calculate percentages
      Object.keys(dimensionProgress).forEach(dimension => {
        const progress = dimensionProgress[dimension];
        progress.percentage = progress.total > 0 ? Math.min(100, Math.round((progress.answered / progress.total) * 100)) : 0;
      });
    }

    // Calculate overall progress - ensure it never exceeds 100%
    const answeredCount = ageAppropriateResponses.length;
    const overallProgress = totalAgeAppropriateQuestions > 0 ? 
      Math.min(100, Math.round((answeredCount / totalAgeAppropriateQuestions) * 100)) : 0;

    return {
      overallProgress,
      dimensionProgress,
      totalQuestions: totalAgeAppropriateQuestions,
      answeredQuestions: answeredCount
    };
  };

  // Calculate metrics using the new backend function
  const calculateMetrics = () => {
    if (!childrenMetrics) {
      return {
        totalChildren: 0,
        childrenInProgress: 0,
        completedJourneys: 0,
        totalSessions: 0,
        activeSessions: 0,
        completedSessions: 0,
        totalReports: 0,
        averageProgress: 0,
        childrenWithProgress: []
      };
    }

    const { children, sessions, reports, responses = [] } = childrenMetrics;
    
    // Use the corrected journey_progress from database (updated by backend function)
    const childrenWithProgress = children.map(child => {
      const childSessions = sessions.filter(s => s.child_id === child.id);
      const childReports = reports.filter(r => r.child_id === child.id);
      const childResponses = responses.filter(r => r.child_id === child.id);
      
      // Use the progress from database (guaranteed to be ≤ 100% by constraint)
      const calculatedProgress = Math.min(100, child.journey_progress || 0);
      
      return {
        ...child,
        calculatedProgress,
        sessionCount: childSessions.length,
        reportCount: childReports.length,
        responseCount: childResponses.length,
        hasActiveSession: childSessions.some(s => s.status === 'active')
      };
    });

    // Trigger backend recalculation for all children (async)
    if (children.length > 0 && user?.id) {
      supabase.functions.invoke('calculate-child-progress', {
        body: { user_id: user.id }
      }).catch(error => {
        console.warn('Error recalculating progress:', error);
      });
    }

    const totalChildren = children.length;
    const childrenInProgress = childrenWithProgress.filter(c => c.calculatedProgress > 0 && c.calculatedProgress < 100).length;
    const completedJourneys = childrenWithProgress.filter(c => c.calculatedProgress >= 100).length;
    const totalSessions = sessions.length;
    const activeSessions = sessions.filter(s => s.status === 'active').length;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const totalReports = reports.length;
    const averageProgress = totalChildren > 0 ? 
      Math.round(childrenWithProgress.reduce((sum, c) => sum + c.calculatedProgress, 0) / totalChildren) : 0;

    return {
      totalChildren,
      childrenInProgress,
      completedJourneys,
      totalSessions,
      activeSessions,
      completedSessions,
      totalReports,
      averageProgress,
      childrenWithProgress
    };
  };

  const metrics = calculateMetrics();

  return {
    metrics,
    rawData: childrenMetrics,
    isLoading,
    error
  };
};