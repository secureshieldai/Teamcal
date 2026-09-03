import { ENV } from '@app/config/env';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022';

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeRequest {
  model?: string;
  max_tokens: number;
  messages: ClaudeMessage[];
  temperature?: number;
  system?: string;
}

export interface ClaudeResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{ type: string; text: string }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

class ClaudeService {
  private apiKey: string;

  constructor() {
    this.apiKey = ENV.CLAUDE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Claude API key not configured');
    }
  }

  async sendMessage(
    messages: ClaudeMessage[],
    options?: {
      maxTokens?: number;
      temperature?: number;
      system?: string;
      model?: string;
    }
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Claude API key not configured');
    }

    try {
      const response = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: options?.model || CLAUDE_MODEL,
          max_tokens: options?.maxTokens || 1024,
          messages,
          temperature: options?.temperature ?? 1,
          ...(options?.system && { system: options.system }),
        } as ClaudeRequest),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Claude API request failed');
      }

      const data: ClaudeResponse = await response.json();
      return data.content[0]?.text || '';
    } catch (error) {
      console.error('Claude API error:', error);
      throw error;
    }
  }

  async chat(prompt: string, conversationHistory: ClaudeMessage[] = []): Promise<string> {
    const messages = [...conversationHistory, { role: 'user' as const, content: prompt }];
    return this.sendMessage(messages);
  }

  async generateText(
    prompt: string,
    options?: {
      maxTokens?: number;
      temperature?: number;
      system?: string;
    }
  ): Promise<string> {
    return this.sendMessage([{ role: 'user', content: prompt }], options);
  }

  async summarize(text: string, maxLength: number = 200): Promise<string> {
    const prompt = `Summarize the following text in ${maxLength} words or less:\n\n${text}`;
    return this.generateText(prompt, { maxTokens: 500 });
  }

  async improveWriting(text: string): Promise<string> {
    const prompt = `Improve and enhance the following text while maintaining its core message:\n\n${text}`;
    return this.generateText(prompt);
  }

  async generateWorkoutPlan(userInfo: {
    fitnessLevel: string;
    goals: string;
    equipment: string;
  }): Promise<string> {
    const prompt = `Create a personalized workout plan for:
- Fitness Level: ${userInfo.fitnessLevel}
- Goals: ${userInfo.goals}
- Available Equipment: ${userInfo.equipment}

Provide a detailed weekly workout plan.`;
    return this.generateText(prompt, { maxTokens: 2048 });
  }

  async generateMealPlan(userInfo: {
    dietType: string;
    calories: number;
    restrictions: string;
  }): Promise<string> {
    const prompt = `Create a meal plan for:
- Diet Type: ${userInfo.dietType}
- Daily Calories: ${userInfo.calories}
- Dietary Restrictions: ${userInfo.restrictions}

Provide a detailed daily meal plan with recipes.`;
    return this.generateText(prompt, { maxTokens: 2048 });
  }

  async analyzeSupplementLabel(ingredients: string): Promise<string> {
    const prompt = `Analyze these supplement ingredients and provide health insights:

${ingredients}

Provide: safety assessment, potential benefits, concerns, and recommendations.`;
    return this.generateText(prompt, { maxTokens: 1500 });
  }

  async generateArticle(topic: string, tone: string = 'informative'): Promise<string> {
    const prompt = `Write a ${tone} article about: ${topic}

Include engaging introduction, key points, and conclusion.`;
    return this.generateText(prompt, { maxTokens: 3000 });
  }

  async generatePostCaption(context: string): Promise<string> {
    const prompt = `Generate an engaging social media caption for: ${context}

Make it catchy, relevant, and include relevant hashtags.`;
    return this.generateText(prompt, { maxTokens: 300 });
  }

  async answerQuestion(question: string, context?: string): Promise<string> {
    const prompt = context 
      ? `Context: ${context}\n\nQuestion: ${question}\n\nProvide a helpful answer.`
      : `Question: ${question}\n\nProvide a helpful answer.`;
    return this.generateText(prompt);
  }
}

export const claudeService = new ClaudeService();
