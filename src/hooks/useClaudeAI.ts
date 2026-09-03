import { useState, useCallback } from 'react';
import { claudeService, ClaudeMessage } from '@services/ai/claude.service';

export const useClaudeAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<string>('');

  const generate = useCallback(async (prompt: string, options?: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await claudeService.generateText(prompt, options);
      setResponse(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const chat = useCallback(async (prompt: string, history: ClaudeMessage[] = []) => {
    setLoading(true);
    setError(null);
    try {
      const result = await claudeService.chat(prompt, history);
      setResponse(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const summarize = useCallback(async (text: string, maxLength?: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await claudeService.summarize(text, maxLength);
      setResponse(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const improveWriting = useCallback(async (text: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await claudeService.improveWriting(text);
      setResponse(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateWorkout = useCallback(async (userInfo: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await claudeService.generateWorkoutPlan(userInfo);
      setResponse(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateMeal = useCallback(async (userInfo: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await claudeService.generateMealPlan(userInfo);
      setResponse(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const analyzeSupplement = useCallback(async (ingredients: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await claudeService.analyzeSupplementLabel(ingredients);
      setResponse(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateArticle = useCallback(async (topic: string, tone?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await claudeService.generateArticle(topic, tone);
      setResponse(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateCaption = useCallback(async (context: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await claudeService.generatePostCaption(context);
      setResponse(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const askQuestion = useCallback(async (question: string, context?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await claudeService.answerQuestion(question, context);
      setResponse(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    response,
    generate,
    chat,
    summarize,
    improveWriting,
    generateWorkout,
    generateMeal,
    analyzeSupplement,
    generateArticle,
    generateCaption,
    askQuestion,
  };
};
