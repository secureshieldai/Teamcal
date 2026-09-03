const fetch = require('node-fetch');

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_WORKSPACE_ID = process.env.CLAUDE_WORKSPACE_ID;

exports.chat = async (req, res) => {
  try {
    const { messages, maxTokens = 1024, temperature = 1, system, model = 'claude-3-5-sonnet-20241022' } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    if (!CLAUDE_API_KEY) {
      return res.status(500).json({ error: 'Claude API key not configured on server' });
    }

    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
    };

    // Add workspace ID if provided (for identity-linked API keys)
    if (CLAUDE_WORKSPACE_ID) {
      headers['anthropic-workspace-id'] = CLAUDE_WORKSPACE_ID;
    }

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages,
        temperature,
        ...(system && { system }),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Claude API request failed');
    }

    const data = await response.json();
    res.json({
      text: data.content[0]?.text || '',
      usage: data.usage,
      model: data.model,
    });
  } catch (error) {
    console.error('Claude API error:', error);
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
