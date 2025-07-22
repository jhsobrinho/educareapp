import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Activity } from 'lucide-react';
import { useCustomAuth as useAuth } from '@/hooks/useCustomAuth';
import { useDashboardMetrics } from '@/hooks/educare-app/useDashboardMetrics';
import { supabase } from '@/integrations/supabase/client';
import CollapsibleDevelopmentCharts from './CollapsibleDevelopmentCharts';

const DevelopmentMilestonesTracker: React.FC = () => {
  const { user } = useAuth();
  const { metrics, rawData, isLoading } = useDashboardMetrics();
  const [isChartsOpen, setIsChartsOpen] = useState(false);
  const [ageBasedProgress, setAgeBasedProgress] = useState<Record<string, any>>({});

  // Calculate age-based progress for each child
  useEffect(() => {
    const calculateAgeBasedProgressForChildren = async () => {
      if (!rawData?.children || !rawData?.responses) return;

      const progressData: Record<string, any> = {};

      for (const child of rawData.children) {
        const childAgeMonths = child.age;
        
        // Fetch age-appropriate questions for this child
        const { data: ageAppropriateQuestions } = await supabase
          .from('journey_bot_questions')
          .select('*')
          .lte('age_min_months', childAgeMonths)
          .gte('age_max_months', childAgeMonths)
          .eq('active', true);

        if (!ageAppropriateQuestions) continue;

        // Filter child responses to only include age-appropriate questions
        const childResponses = rawData.responses.filter(r => r.child_id === child.id);
        const ageAppropriateResponses = childResponses.filter(response => {
          return ageAppropriateQuestions.some(q => q.id === response.question_id);
        });

        // Calculate progress by dimension
        const dimensionProgress: Record<string, { answered: number; total: number; percentage: number }> = {};
        
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

        // Calculate percentages - ensure never exceeds 100%
        Object.keys(dimensionProgress).forEach(dimension => {
          const progress = dimensionProgress[dimension];
          progress.percentage = progress.total > 0 ? Math.min(100, Math.round((progress.answered / progress.total) * 100)) : 0;
        });

        // Calculate overall progress - ensure never exceeds 100%
        const answeredCount = ageAppropriateResponses.length;
        const totalQuestions = ageAppropriateQuestions.length;
        const overallProgress = totalQuestions > 0 ? 
          Math.min(100, Math.round((answeredCount / totalQuestions) * 100)) : 0;

        progressData[child.id] = {
          overallProgress,
          dimensionProgress,
          totalQuestions,
          answeredQuestions: answeredCount
        };
      }

      setAgeBasedProgress(progressData);
    };

    calculateAgeBasedProgressForChildren();
  }, [rawData]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!rawData?.children?.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Cadastre uma criança e realize avaliações para visualizar os marcos de desenvolvimento
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate aggregate progress for all children
  const aggregateProgress = Object.values(ageBasedProgress).reduce((acc, childProgress) => {
    Object.entries(childProgress.dimensionProgress || {}).forEach(([dimension, progress]: [string, any]) => {
      if (!acc[dimension]) {
        acc[dimension] = { answered: 0, total: 0, percentage: 0 };
      }
      acc[dimension].answered += progress.answered;
      acc[dimension].total += progress.total;
    });
    return acc;
  }, {} as Record<string, { answered: number; total: number; percentage: number }>);

  // Calculate percentages for aggregate
  Object.keys(aggregateProgress).forEach(dimension => {
    const progress = aggregateProgress[dimension];
    progress.percentage = progress.total > 0 ? Math.min(100, Math.round((progress.answered / progress.total) * 100)) : 0;
  });

  const overallProgress = Object.keys(ageBasedProgress).length > 0 ? 
    Math.min(100, Math.round(Object.values(ageBasedProgress).reduce((sum, child) => sum + child.overallProgress, 0) / Object.keys(ageBasedProgress).length)) : 0;

  return (
    <div className="space-y-4">
      {/* Collapsible Development Charts */}
      <CollapsibleDevelopmentCharts
        dimensionProgress={aggregateProgress}
        overallProgress={overallProgress}
        isOpen={isChartsOpen}
        onToggle={() => setIsChartsOpen(!isChartsOpen)}
      />

      {/* Children Summary Cards */}
      {rawData.children.map(child => {
        const childProgress = ageBasedProgress[child.id];
        const childWithMetrics = metrics.childrenWithProgress?.find(c => c.id === child.id) || child;
        const responseCount = (childWithMetrics as any).responseCount || 0;
        const sessionCount = (childWithMetrics as any).sessionCount || 0;
        
        if (!childProgress) return null;

        return (
          <Card key={child.id} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-sm">{child.first_name} {child.last_name}</h3>
                <p className="text-xs text-muted-foreground">
                  {childProgress.answeredQuestions}/{childProgress.totalQuestions} marcos • {sessionCount} sessões
                </p>
              </div>
              <Badge variant={childProgress.overallProgress >= 80 ? "default" : childProgress.overallProgress >= 60 ? "secondary" : "outline"}>
                {childProgress.overallProgress}%
              </Badge>
            </div>
            
            {/* Progress by dimension for this child */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(childProgress.dimensionProgress).map(([dimension, progress]: [string, any]) => (
                <div key={dimension} className="text-center p-2 bg-muted/30 rounded">
                  <div className="text-xs font-medium mb-1">
                    {dimension.replace('_', ' ')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {progress.percentage}%
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default DevelopmentMilestonesTracker;