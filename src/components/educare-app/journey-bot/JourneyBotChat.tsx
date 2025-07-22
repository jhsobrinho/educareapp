
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useJourneyBotSession } from '@/hooks/educare-app/useJourneyBotSession';
import { supabase } from '@/integrations/supabase/client';
import { useCustomAuth as useAuth } from '@/hooks/useCustomAuth';
import { useToast } from '@/hooks/use-toast';
import { JourneyBotResponse } from '@/types/journey-bot';
import JourneyBotQuestion from './JourneyBotQuestion';
import JourneyBotFeedback from './JourneyBotFeedback';
import JourneyBotLoading from './JourneyBotLoading';
import JourneyBotErrorState from './JourneyBotErrorState';
import JourneyBotProgressManager from './JourneyBotProgressManager';

interface Child {
  id: string;
  name: string;
  age: number;
}

interface JourneyBotChatProps {
  child: Child;
  onBack: () => void;
}

const JourneyBotChat: React.FC<JourneyBotChatProps> = ({ child, onBack }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const {
    currentSession,
    questions,
    isLoading,
    error,
    refreshSession
  } = useJourneyBotSession({ 
    childId: child.id, 
    childAge: child.age 
  });

  const [responses, setResponses] = useState<JourneyBotResponse[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isAnswering, setIsAnswering] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<1 | 2 | 3 | null>(null);

  // Load existing responses
  useEffect(() => {
    const loadResponses = async () => {
      if (!currentSession || !user) return;

      try {
        const { data: responsesData, error: responsesError } = await supabase
          .from('journey_bot_responses')
          .select('*')
          .eq('session_id', currentSession.id)
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (responsesError) {
          console.error('Error loading responses:', responsesError);
          return;
        }

        // Cast the database response to proper types
        const typedResponses: JourneyBotResponse[] = (responsesData || []).map(response => ({
          ...response,
          answer: response.answer as 1 | 2 | 3 // Cast number to union type
        }));
        
        setResponses(typedResponses);
        setCurrentQuestionIndex(typedResponses.length);
      } catch (err) {
        console.error('Exception loading responses:', err);
      }
    };

    loadResponses();
  }, [currentSession, user]);

  const handleAnswer = useCallback(async (answer: 1 | 2 | 3) => {
    if (!currentSession || !user || !questions[currentQuestionIndex]) return;

    setIsAnswering(true);
    setLastAnswer(answer);

    try {
      const currentQuestion = questions[currentQuestionIndex];
      const answerText = answer === 1 ? 'Sim - Consegue fazer' : 
                        answer === 2 ? 'Não - Ainda não consegue' : 
                        'Não sei - Preciso observar';

      const { data: responseData, error: responseError } = await supabase
        .from('journey_bot_responses')
        .insert({
          session_id: currentSession.id,
          user_id: user.id,
          child_id: child.id,
          question_id: currentQuestion.id,
          answer: answer,
          dimension: currentQuestion.dimension,
          question_text: currentQuestion.question_text,
          answer_text: answerText
        })
        .select()
        .single();

      if (responseError) {
        console.error('Error saving response:', responseError);
        throw responseError;
      }

      // Cast the response to proper type
      const typedResponse: JourneyBotResponse = {
        ...responseData,
        answer: responseData.answer as 1 | 2 | 3
      };

      setResponses(prev => [...prev, typedResponse]);
      setShowFeedback(true);

      // Update session progress
      const newAnsweredCount = responses.length + 1;
      await supabase
        .from('journey_bot_sessions')
        .update({ 
          answered_questions: newAnsweredCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSession.id);

    } catch (err: any) {
      console.error('Error saving answer:', err);
      toast({
        title: "Erro ao salvar resposta",
        description: err.message || "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    } finally {
      setIsAnswering(false);
    }
  }, [currentSession, user, child.id, questions, currentQuestionIndex, responses.length, toast]);

  const handleContinue = useCallback(() => {
    setShowFeedback(false);
    setLastAnswer(null);
    setCurrentQuestionIndex(prev => prev + 1);
  }, []);

  // Loading state
  if (isLoading) {
    return <JourneyBotLoading childName={child.name} />;
  }

  // Error state
  if (error) {
    return (
      <JourneyBotErrorState
        error={error}
        onRetry={refreshSession}
        onBack={onBack}
      />
    );
  }

  // No questions available
  if (questions.length === 0) {
    return (
      <JourneyBotErrorState
        error={`Não encontramos perguntas adequadas para ${child.name} (${child.age} anos).`}
        onRetry={refreshSession}
        onBack={onBack}
      />
    );
  }

  // Session completed
  if (currentQuestionIndex >= questions.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-8"
      >
        <div className="text-center space-y-6">
          <h2 className="text-3xl font-bold text-green-600">
            🎉 Parabéns! Jornada Concluída!
          </h2>
          <p className="text-lg text-gray-600">
            Você completou todas as perguntas para {child.name}!
          </p>
          <Button onClick={onBack} size="lg">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Voltar
          </Button>
        </div>
      </motion.div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Progress */}
      <JourneyBotProgressManager
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={questions.length}
        childName={child.name}
        sessionStarted={currentSession?.started_at || new Date().toISOString()}
        dimension={currentQuestion?.dimension}
      />

      {/* Question or Feedback */}
      {showFeedback && lastAnswer ? (
        <JourneyBotFeedback
          question={currentQuestion}
          answer={lastAnswer}
          onContinue={handleContinue}
        />
      ) : (
        <JourneyBotQuestion
          question={currentQuestion}
          onAnswer={handleAnswer}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          disabled={isAnswering}
        />
      )}
    </div>
  );
};

export default JourneyBotChat;
