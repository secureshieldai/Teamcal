/**
 * Claude Controller - NOW USING OPENAI
 * This controller has been migrated to use OpenAI instead of Claude
 * All Claude-related features now use OpenAI GPT-4o
 */

const OpenAI = require("openai");

const AI_ENABLED = Boolean(
  process.env.OPENAI_API_KEY && 
  !/^your_|placeholder|change-me|sk-proj-$/i.test(process.env.OPENAI_API_KEY)
);

let openai;
if (AI_ENABLED) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

exports.chat = async (req, res) => {
  try {
    const { messages, maxTokens = 1024, temperature = 1, system, model = 'gpt-4o' } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    if (!AI_ENABLED) {
      return res.status(500).json({ error: 'OpenAI API key not configured on server' });
    }

    const openaiMessages = system 
      ? [{ role: 'system', content: system }, ...messages]
      : messages;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || model,
      messages: openaiMessages,
      max_tokens: maxTokens,
      temperature: temperature,
    });

    res.json({
      text: completion.choices[0].message.content || '',
      usage: completion.usage,
      model: completion.model,
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.generate = async (req, res) => {
  try {
    const { prompt, maxTokens = 1024, temperature = 1, system } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const messages = [{ role: 'user', content: prompt }];
    
    req.body = { messages, maxTokens, temperature, system };
    return exports.chat(req, res);
  } catch (error) {
    console.error('Generate error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.generateWorkout = async (req, res) => {
  try {
    const { fitnessLevel, goals, equipment } = req.body;

    const prompt = `Create a personalized workout plan for:
- Fitness Level: ${fitnessLevel}
- Goals: ${goals}
- Available Equipment: ${equipment}

Provide a detailed weekly workout plan with exercises, sets, reps, and rest periods.`;

    req.body = { prompt, maxTokens: 2048 };
    return exports.generate(req, res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.generateMeal = async (req, res) => {
  try {
    const { dietType, calories, restrictions } = req.body;

    const prompt = `Create a meal plan for:
- Diet Type: ${dietType}
- Daily Calories: ${calories}
- Dietary Restrictions: ${restrictions}

Provide a detailed daily meal plan with recipes, ingredients, and nutritional info.`;

    req.body = { prompt, maxTokens: 2048 };
    return exports.generate(req, res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.analyzeSupplement = async (req, res) => {
  try {
    const { ingredients } = req.body;

    const prompt = `Analyze these supplement ingredients and provide health insights:

${ingredients}

Provide: safety assessment, potential benefits, concerns, and recommendations.`;

    req.body = { prompt, maxTokens: 1500 };
    return exports.generate(req, res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
