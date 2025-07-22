import { supabase } from '@/integrations/supabase/client';
import { JourneyBotQuestion } from '@/types/journey-bot';
import { DimensionIcons, DimensionLabels } from '@/types/journey-bot';

export interface DatabaseQuestionOptions {
  value: number;
  text: string;
  emoji: string;
}

export interface DatabaseQuestionMetadata {
  categoryName: string;
  categoryIcon: string;
  importance: string;
  options: DatabaseQuestionOptions[];
  feedbacks: {
    [key: string]: string;
  };
  activity: string;
}

export interface AgeRangeModule {
  ageRange: string;
  minMonths: number;
  maxMonths: number;
  questions: JourneyBotQuestion[];
  currentQuestionIndex: number;
  totalQuestions: number;
  answeredQuestions: number;
  isCompleted: boolean;
  isUnlocked: boolean;
}

export class DatabaseAdapter {
  /**
   * Carrega módulos organizados por faixa etária para uma idade específica
   */
  static async getAgeRangeModulesForAge(childAgeInMonths: number): Promise<AgeRangeModule[]> {
    try {
      console.log('Carregando módulos por faixa etária para idade:', childAgeInMonths, 'meses');
      
      // Buscar todas as perguntas e agrupar por faixa etária
      const { data: questionsData, error } = await supabase
        .from('journey_bot_questions')
        .select('*')
        .eq('active', true)
        .order('age_min_months')
        .order('age_max_months')
        .order('order_index');

      if (error) {
        console.error('Erro ao carregar perguntas:', error);
        throw error;
      }

      if (!questionsData || questionsData.length === 0) {
        console.warn('Nenhuma pergunta encontrada no banco de dados');
        return [];
      }

      // Agrupar perguntas por faixa etária
      const moduleMap = new Map<string, any[]>();
      
      questionsData.forEach(question => {
        const ageRangeKey = `${question.age_min_months}-${question.age_max_months}`;
        if (!moduleMap.has(ageRangeKey)) {
          moduleMap.set(ageRangeKey, []);
        }
        moduleMap.get(ageRangeKey)!.push(question);
      });

      // Converter para módulos de faixa etária
      const modules: AgeRangeModule[] = [];
      
      for (const [ageRangeKey, questions] of moduleMap.entries()) {
        const [minMonths, maxMonths] = ageRangeKey.split('-').map(Number);
        
        // Determinar se o módulo está desbloqueado (baseado na idade da criança)
        const isCurrentOrPrevious = childAgeInMonths >= minMonths;
        
        const enhancedQuestions = questions.map((dbQuestion, index) => 
          this.enhanceQuestionWithWhatsAppMetadata(dbQuestion, index)
        );

        const module: AgeRangeModule = {
          ageRange: this.formatAgeRange(minMonths, maxMonths),
          minMonths,
          maxMonths,
          questions: enhancedQuestions,
          currentQuestionIndex: 0,
          totalQuestions: enhancedQuestions.length,
          answeredQuestions: 0,
          isCompleted: false,
          isUnlocked: isCurrentOrPrevious
        };

        modules.push(module);
      }

      // Ordenar módulos por idade
      modules.sort((a, b) => a.minMonths - b.minMonths);

      console.log('Módulos criados:', modules.length);
      modules.forEach(m => console.log(`- ${m.ageRange}: ${m.totalQuestions} perguntas, ${m.isUnlocked ? 'desbloqueado' : 'bloqueado'}`));
      
      return modules;
      
    } catch (error) {
      console.error('Erro ao carregar módulos por faixa etária:', error);
      return [];
    }
  }

  /**
   * Formata faixa etária para exibição
   */
  private static formatAgeRange(minMonths: number, maxMonths: number): string {
    if (maxMonths <= 12) {
      return `${minMonths}-${maxMonths} meses`;
    } else {
      const minYears = Math.floor(minMonths / 12);
      const maxYears = Math.floor(maxMonths / 12);
      if (minYears === maxYears) {
        return `${minYears} ano${minYears > 1 ? 's' : ''}`;
      }
      return `${minYears}-${maxYears} anos`;
    }
  }

  /**
   * Mantém compatibilidade - retorna todas as perguntas linearmente
   */
  static async getQuestionsForAge(childAgeInMonths: number): Promise<JourneyBotQuestion[]> {
    const modules = await this.getAgeRangeModulesForAge(childAgeInMonths);
    
    // Retorna perguntas apenas dos módulos desbloqueados
    const unlockedQuestions: JourneyBotQuestion[] = [];
    for (const module of modules) {
      if (module.isUnlocked) {
        unlockedQuestions.push(...module.questions);
      }
    }
    
    return unlockedQuestions;
  }

  /**
   * Enriquece uma pergunta do banco com metadados para interface WhatsApp
   */
  private static enhanceQuestionWithWhatsAppMetadata(
    dbQuestion: any, 
    index: number
  ): JourneyBotQuestion {
    const dimension = dbQuestion.dimension;
    const categoryIcon = DimensionIcons[dimension] || '📝';
    const categoryName = DimensionLabels[dimension] || 'Desenvolvimento';

    // Create WhatsApp-style options
    const options: DatabaseQuestionOptions[] = [
      {
        value: 1,
        text: 'Sim! {childName} consegue fazer isso 😊',
        emoji: '✅'
      },
      {
        value: 3,
        text: 'Ainda não vimos isso 🤔',
        emoji: '❓'
      },
      {
        value: 2,
        text: 'Às vezes {ele/ela} faz isso 💫',
        emoji: '🔄'
      }
    ];

    // Create feedbacks map
    const feedbacks = {
      '1': dbQuestion.feedback_yes || 'Excelente! Continue assim!',
      '2': dbQuestion.feedback_unknown || 'Continue observando e estimulando.',
      '3': dbQuestion.feedback_no || 'Não se preocupe, vamos trabalhar isso juntos!'
    };

    // Create activity suggestion from tips
    const allTips = [
      ...(dbQuestion.tips_yes || []),
      ...(dbQuestion.tips_no || []),
      ...(dbQuestion.tips_unknown || [])
    ];
    const activity = allTips.length > 0 
      ? `💡 Dica para o desenvolvimento: ${allTips[0]}`
      : 'Continue estimulando {childName} com amor e paciência! 💕';

    // Create importance message
    const importance = `Esta é uma área muito importante para o desenvolvimento do {childName}. Vamos ver como {ele/ela} está se saindo! 🌟`;

    // Attach WhatsApp metadata
    const enhancedQuestion: JourneyBotQuestion = {
      ...dbQuestion,
      jsonData: {
        categoryName,
        categoryIcon,
        importance,
        options,
        feedbacks,
        activity
      }
    };

    return enhancedQuestion;
  }

  /**
   * Verifica se há perguntas disponíveis para uma idade
   */
  static async hasQuestionsForAge(childAgeInMonths: number): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('journey_bot_questions')
        .select('id')
        .lte('age_min_months', childAgeInMonths + 3)
        .gte('age_max_months', Math.max(0, childAgeInMonths - 3))
        .eq('active', true)
        .limit(1);

      if (error) {
        console.error('Erro ao verificar perguntas:', error);
        return false;
      }

      return (data && data.length > 0);
    } catch (error) {
      console.error('Erro ao verificar disponibilidade de perguntas:', error);
      return false;
    }
  }

  /**
   * Cria metadados do módulo atual baseado na idade da criança
   */
  static async createCurrentModuleMetadata(childAgeInMonths: number): Promise<{
    title: string;
    min_months: number;
    max_months: number;
    description: string;
  }> {
    const modules = await this.getAgeRangeModulesForAge(childAgeInMonths);
    
    // Encontrar o módulo atual (primeiro módulo desbloqueado que não está completo)
    const currentModule = modules.find(m => m.isUnlocked && !m.isCompleted) || modules[0];
    
    if (!currentModule) {
      return {
        title: 'Desenvolvimento Infantil',
        min_months: 0,
        max_months: 12,
        description: 'Avaliação do desenvolvimento'
      };
    }

    return {
      title: currentModule.ageRange,
      min_months: currentModule.minMonths,
      max_months: currentModule.maxMonths,
      description: `Módulo ${currentModule.ageRange} - ${currentModule.totalQuestions} perguntas`
    };
  }
}