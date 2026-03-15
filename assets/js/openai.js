// GRACE-X OpenAI Integration
// Asynchronous hook into the central Gracex.brain.js API loop

(function() {
  if (window.GRACEX_OpenAI) return;

  const API_URL = 'https://api.openai.com/v1/chat/completions';

  window.GRACEX_OpenAI = {
    getKey: function() {
      return localStorage.getItem('openai_api_key');
    },
    setKey: function(key) {
      if (!key) return false;
      localStorage.setItem('openai_api_key', key.trim());
      return true;
    },
    removeKey: function() {
      localStorage.removeItem('openai_api_key');
    }
  };

  async function fetchOpenAIRes(payload) {
    const input = payload.input;
    const text = (input?.text || "").trim();
    const routeResult = payload.routeResult || {};

    // 1. Check if the user is trying to set their key
    if (text.toLowerCase().startsWith('set openai key ')) {
      const key = text.substring('set openai key '.length).trim();
      GRACEX_OpenAI.setKey(key);
      return { reply: "OpenAI API Key securely stored in local storage!" };
    }

    const apiKey = GRACEX_OpenAI.getKey();
    if (!apiKey) {
      return { reply: "I need an OpenAI API key to process this. Please reply with: 'Set OpenAI key sk-YOUR_KEY_HERE'." };
    }

    try {
      // 2. Build Context
      let systemPrompt = `You are GRACE-X, an advanced AI unified system running inside a browser environment.
Your personality is: Confident UK female. Calm authority.
You assist with tasks across various modules like Builder, SiteOps, TradeLink, Security, Family, etc.
Current Time: ${new Date().toLocaleTimeString()}
Current Date: ${new Date().toLocaleDateString()}
`;
      // Gather voice memory if available
      let voiceContextBuffer = [];
      if (window.GraceX && window.GraceX.RAM) {
        voiceContextBuffer = window.GraceX.RAM.getBuffer("voice_context") || [];
      }
      if (voiceContextBuffer.length > 0) {
        systemPrompt += `\nRecent conversation history:\n${voiceContextBuffer.map(h => "- " + h).join('\n')}`;
      }
      if (window.GraceX && window.GraceX.state && window.GraceX.state.activeModule) {
         systemPrompt += `\nThe user is currently interacting with the '${window.GraceX.state.activeModule}' module.`;
      }

      // 3. Make API Call
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text }
          ],
          temperature: 0.7,
          max_tokens: 300
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error('[OPENAI API ERROR]', response.status, errData);
        if (response.status === 401) {
            return { reply: "My OpenAI API key seems to be invalid. Please provide a new one using 'Set OpenAI key [your-key]'." };
        }
        return { reply: "[External API Connectivity Error] Could not reach the OpenAI servers." };
      }

      const data = await response.json();
      const assistantMessage = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      
      return { reply: assistantMessage || "I'm sorry, I received an empty response from my external logic cores." };

    } catch(err) {
      console.error('[OPENAI FETCH ERROR]', err);
      return { reply: "I encountered a network issue trying to reach OpenAI." };
    }
  }

  const intentsToOverride = [
    'chat', 'greet', 'explain', 'task', 'calculate', 
    'humor', 'capability', 'identity', 'unknown'
  ];

  function registerAll() {
    intentsToOverride.forEach(intent => {
      window.GraceX.registerAPI(intent, fetchOpenAIRes);
    });
    console.log('[GRACEX OPENAI] Hooks successfully registered with Brain engine for intents: ', intentsToOverride.join(', '));
  }

  // Register the hook directly into our Track 3 Brain logic
  if (window.GraceX && typeof window.GraceX.registerAPI === 'function') {
    registerAll();
  } else {
    console.warn('[GRACEX OPENAI] Could not find GraceX API Registrar. Delaying hook...');
    // Fallback for async load order differences
    setTimeout(() => {
      if (window.GraceX && window.GraceX.registerAPI) {
        registerAll();
      }
    }, 2000);
  }

})();
