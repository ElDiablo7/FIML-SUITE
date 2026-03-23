// GRACE-X Level 5 Brains™ v2.0
// Advanced AI integration with conversation memory and context
// Supports: OpenAI, Anthropic, OpenRouter, Ollama (local)
// Falls back to Level 1 (keyword) brains if API unavailable
// ------------------------------

(function () {
  'use strict';

  // Configuration
  const BRAIN_CONFIG = {
    // API endpoint - set this to your backend proxy
    apiEndpoint: window.GRACEX_BRAIN_API || '/api/brain',
    
    // Fallback mode: 'keyword' (Level 1) or 'hybrid' (try API, fallback to keyword)
    fallbackMode: 'hybrid',
    
    // Enable conversation memory
    enableMemory: true,
    
    // Max conversation history to send
    maxHistory: 10,
    
    // Request timeout (ms)
    timeout: 30000,
    
    // Retry configuration
    maxRetries: 2,
    retryDelay: 1000,
    
    // Module-specific system prompts
    systemPrompts: {
      builder: "You are GRACE-X Builder, a helpful assistant for construction, measurements, and building projects. Be practical, safety-focused, and concise. When discussing measurements, always clarify units.",
      siteops: "You are GRACE-X SiteOps, a professional rigging and site operations assistant. Focus on safety, phases, and practical on-site advice. Always prioritize safety protocols.",
      tradelink: "You are GRACE-X TradeLink, connecting tradespeople with jobs. Help structure job briefs, quotes, and client communication. Be professional and clear.",
      uplift: "You are GRACE-X Uplift, a gentle wellbeing assistant. You're not a doctor, but you can help with grounding, anxiety, and mental health support. Always direct serious cases to professional help. Be compassionate.",
      beauty: "You are GRACE-X Beauty, a style and confidence assistant. Help with hair, skin, makeup, and outfits. Keep it real, practical, and body-positive.",
      fit: "You are GRACE-X Fit, a fitness and movement assistant. Focus on realistic, sustainable fitness advice. Always recommend consulting professionals for medical concerns.",
      yoga: "You are GRACE-X Yoga, a gentle movement and breathing assistant. Suggest safe stretches and breathing exercises. Emphasize mindfulness and listening to your body.",
      chef: "You are GRACE-X Chef, a cooking and meal planning assistant. Help with fakeaways, budget meals, and kitchen tips. Be creative and practical.",
      artist: "You are GRACE-X Artist, a creative assistant for visual art, design, and creative projects. Encourage experimentation and provide constructive feedback.",
      family: "You are GRACE-X Family, a family life assistant. Help with routines, homework, screen time, and family dynamics. Be supportive and understanding.",
      gamer: "You are GRACE-X Gamer Mode, a gaming and screen-time balance assistant. Help with game recommendations, balance, and healthy gaming habits.",
      accounting: "You are GRACE-X Accounting, a bookkeeping and expense tracking assistant. Provide general advice but always recommend professional accountants for complex tax matters. Be precise with numbers.",
      osint: "You are GRACE-X OSINT, a professional open-source intelligence assistant. Focus on ethical, legal information gathering only. Never assist with anything that could harm individuals.",
      production: "You are GRACE-X Production, helping with budgets, scheduling, approvals, and line producing. Use page context when provided to calculate or advise.",
      assistant_directors: "You are GRACE-X 1st AD / Call Sheets, helping with call sheets and AD logistics. Use page context when provided.",
      safety: "You are GRACE-X Safety & Compliance, helping with risk, incidents, and on-set safety. Use page context when provided.",
      finance: "You are GRACE-X Finance, helping with budgets and department spend. Use page context to calculate or explain.",
      locations: "You are GRACE-X Locations, helping with location scouting and permits. Use page context when provided.",
      casting: "You are GRACE-X Casting, helping with talent and casting logistics. Use page context when provided.",
      creative: "You are GRACE-X Creative, helping with creative direction and tone. Use page context when provided.",
      art: "You are GRACE-X Art / Set Design, helping with set design and props. Use page context when provided.",
      costume: "You are GRACE-X Costume, helping with wardrobe and fittings. Use page context when provided.",
      hmu: "You are GRACE-X Hair & Makeup, helping with HMU logistics. Use page context when provided.",
      camera: "You are GRACE-X Camera, helping with camera department and shot lists. Use page context when provided.",
      lighting: "You are GRACE-X Lighting, helping with lighting and electric. Use page context to calculate or advise.",
      grip: "You are GRACE-X Grip, helping with grip and rigging. Use page context when provided.",
      sound: "You are GRACE-X Sound, helping with sound department. Use page context when provided.",
      sfx: "You are GRACE-X Special Effects, helping with SFX planning. Use page context when provided.",
      stunts: "You are GRACE-X Stunts, helping with stunt coordination. Use page context when provided.",
      post: "You are GRACE-X Post Production, helping with edit and VFX. Use page context when provided.",
      publicity: "You are GRACE-X Publicity, helping with EPK and press. Use page context when provided.",
      vault: "You are GRACE-X Asset Vault, helping with assets and deliverables. Use page context when provided."
    }
  };

  // Conversation memory storage (per module)
  const conversationMemory = {};

  // Connection status tracking
  let connectionStatus = {
    lastSuccess: null,
    lastError: null,
    consecutiveFailures: 0,
    isHealthy: true
  };

  // Get conversation history for a module
  function getConversationHistory(moduleId) {
    if (!BRAIN_CONFIG.enableMemory) return [];
    
    const history = conversationMemory[moduleId] || [];
    // Return last N messages
    return history.slice(-BRAIN_CONFIG.maxHistory);
  }

  // Add message to conversation history
  function addToHistory(moduleId, role, content) {
    if (!BRAIN_CONFIG.enableMemory) return;
    
    if (!conversationMemory[moduleId]) {
      conversationMemory[moduleId] = [];
    }
    
    conversationMemory[moduleId].push({
      role: role,
      content: content,
      timestamp: Date.now()
    });
    
    // Keep history manageable
    if (conversationMemory[moduleId].length > BRAIN_CONFIG.maxHistory * 2) {
      conversationMemory[moduleId] = conversationMemory[moduleId].slice(-BRAIN_CONFIG.maxHistory);
    }
    
    // Persist to localStorage
    try {
      localStorage.setItem(`gracex_history_${moduleId}`, JSON.stringify(conversationMemory[moduleId]));
    } catch (e) {
      console.warn('[GRACEX] Could not persist conversation history, memory may be full. Pruning...', e);
      if (e.name === 'QuotaExceededError' || e.message.includes('quota')) {
        // Prune the oldest 50%
        const keepCount = Math.floor(conversationMemory[moduleId].length / 2);
        conversationMemory[moduleId] = conversationMemory[moduleId].slice(-keepCount);
        try {
          localStorage.setItem(`gracex_history_${moduleId}`, JSON.stringify(conversationMemory[moduleId]));
        } catch (subErr) {
          console.error('[GRACEX] Critical: Unable to persist even after pruning.', subErr);
        }
      }
    }
  }

  // Load history from localStorage on init
  function loadHistoryFromStorage(moduleId) {
    try {
      const stored = localStorage.getItem(`gracex_history_${moduleId}`);
      if (stored) {
        conversationMemory[moduleId] = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('[GRACEX] Could not load conversation history');
    }
  }

  // Clear conversation history for a module
  function clearHistory(moduleId) {
    if (conversationMemory[moduleId]) {
      conversationMemory[moduleId] = [];
    }
    try {
      localStorage.removeItem(`gracex_history_${moduleId}`);
    } catch (e) {
      // Ignore
    }
  }

  // Clear all conversation history
  function clearAllHistory() {
    Object.keys(conversationMemory).forEach(moduleId => {
      clearHistory(moduleId);
    });
  }

  // Fetch with timeout
  async function fetchWithTimeout(url, options, timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
  }

  // Call Level 5 brain API with retry logic
  async function callLevel5Brain(moduleId, userMessage, retryCount = 0) {
    const systemPrompt = BRAIN_CONFIG.systemPrompts[moduleId] || 
      `You are GRACE-X ${moduleId}, a helpful assistant. Be friendly, concise, and helpful.`;
    
    // Load history if not already loaded
    if (!conversationMemory[moduleId]) {
      loadHistoryFromStorage(moduleId);
    }
    
    const history = getConversationHistory(moduleId);
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: userMessage }
    ];

    try {
      const response = await fetchWithTimeout(BRAIN_CONFIG.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': `gx-fe-${Date.now().toString(36)}`
        },
        body: JSON.stringify({
          module: moduleId,
          messages: messages,
          temperature: 0.7,
          max_tokens: 500
        })
      }, BRAIN_CONFIG.timeout);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = errorData.retryAfter || 60;
          throw new Error(`Rate limited. Please wait ${retryAfter} seconds.`);
        }
        
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const reply = data.reply || data.message || data.content || "I'm not sure how to respond to that.";
      
      // Add to history
      addToHistory(moduleId, 'user', userMessage);
      addToHistory(moduleId, 'assistant', reply);
      
      // Update connection status
      connectionStatus.lastSuccess = Date.now();
      connectionStatus.consecutiveFailures = 0;
      connectionStatus.isHealthy = true;
      
      return reply;
    } catch (error) {
      console.warn('[GRACEX Level 5 Brain] API call failed:', error.message);
      
      // Update connection status
      connectionStatus.lastError = Date.now();
      connectionStatus.consecutiveFailures++;
      
      if (connectionStatus.consecutiveFailures >= 3) {
        connectionStatus.isHealthy = false;
      }
      
      // Retry logic
      if (retryCount < BRAIN_CONFIG.maxRetries && !error.message.includes('Rate limited')) {
        console.info(`[GRACEX] Retrying (${retryCount + 1}/${BRAIN_CONFIG.maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, BRAIN_CONFIG.retryDelay));
        return callLevel5Brain(moduleId, userMessage, retryCount + 1);
      }
      
      throw error;
    }
  }

  // Check API health
  async function checkApiHealth() {
    try {
      const healthUrl = BRAIN_CONFIG.apiEndpoint.replace('/api/brain', '/health');
      const response = await fetchWithTimeout(healthUrl, {}, 5000);
      const data = await response.json();
      return data.status === 'ok';
    } catch (error) {
      return false;
    }
  }

  // Get connection status
  function getConnectionStatus() {
    return { ...connectionStatus };
  }

  // Level 5 brain handler with fallback
  async function runLevel5Brain(moduleId, text) {
    const t = (text || "").trim();
    if (!t) {
      return "Tell me what you need help with.";
    }

    // Require internet connectivity for Core orchestration
    if (!navigator.onLine && moduleId === 'core') {
      return "Core requires an internet connection to reach the brain API. Please reconnect.";
    }

    // Check if API is configured (same-origin /api/brain is valid)
    const apiConfigured = !!(BRAIN_CONFIG.apiEndpoint && String(BRAIN_CONFIG.apiEndpoint).trim());

    // Try Level 5 API first if configured and healthy
    if (apiConfigured && (connectionStatus.isHealthy || connectionStatus.consecutiveFailures < 5)) {
      try {
        return await callLevel5Brain(moduleId, t);
      } catch (error) {
        // Fall through to Level 1 fallback
        if (BRAIN_CONFIG.fallbackMode === 'hybrid') {
          console.info('[GRACEX Level 5] Falling back to Level 1 brain');
        } else {
          return `I'm having trouble connecting right now. ${error.message || 'Please try again in a moment.'}`;
        }
      }
    }

    // Fallback to Level 1 (keyword-based) brain
    if (window.runModuleBrainOriginal && typeof window.runModuleBrainOriginal === 'function') {
      const fallbackReply = window.runModuleBrainOriginal(moduleId, t);
      // Still add to history for context
      addToHistory(moduleId, 'user', t);
      addToHistory(moduleId, 'assistant', fallbackReply);
      return fallbackReply instanceof Promise ? await fallbackReply : fallbackReply;
    }

    return "Prototype brain here. This module hasn't had its full intelligence trained yet.";
  }

  // Expose Level 5 brain system
  window.runLevel5Brain = runLevel5Brain;
  window.clearBrainHistory = clearHistory;
  window.clearAllBrainHistory = clearAllHistory;
  window.getBrainHistory = getConversationHistory;
  window.checkBrainHealth = checkApiHealth;
  window.getBrainStatus = getConnectionStatus;

  // Store original brain function before wrapping
  let originalBrainStored = false;

  // Auto-upgrade runModuleBrain if Level 5 is available
  function setupBrainWrapper() {
    const originalRunModuleBrain = window.runModuleBrain;
    
    if (originalRunModuleBrain && typeof originalRunModuleBrain === 'function' && !originalBrainStored) {
      // Store original for fallback
      window.runModuleBrainOriginal = originalRunModuleBrain;
      originalBrainStored = true;
      
      // Wrap original to add Level 5 capability
      const wrappedBrain = async function(moduleId, text) {
        // Check if Level 5 is enabled (API endpoint configured)
        const apiConfigured = BRAIN_CONFIG.apiEndpoint && 
                              BRAIN_CONFIG.apiEndpoint !== '';
        
        if (apiConfigured) {
          try {
            return await runLevel5Brain(moduleId, text);
          } catch (error) {
            // Fallback to original Level 1
            const fallback = window.runModuleBrainOriginal(moduleId, text);
            return fallback instanceof Promise ? fallback : Promise.resolve(fallback);
          }
        }
        // Use original Level 1 brain (may be sync or async)
        const result = window.runModuleBrainOriginal(moduleId, text);
        return result instanceof Promise ? result : Promise.resolve(result);
      };
      
      window.runModuleBrain = wrappedBrain;
      console.info('[GRACEX] Level 5 brain wrapper installed');
    } else if (!originalRunModuleBrain) {
      // If no original, just use Level 5
      window.runModuleBrain = runLevel5Brain;
    }
  }

  // Setup wrapper after short delay to ensure core.js loads first
  setTimeout(setupBrainWrapper, 100);
  
  // Also setup on DOMContentLoaded in case setTimeout isn't enough
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(setupBrainWrapper, 50);
    });
  }

  // Log configuration status
  const apiConfigured = BRAIN_CONFIG.apiEndpoint && 
                        BRAIN_CONFIG.apiEndpoint !== '';
  
  console.info(
    `[GRACEX] Level 5 Brains v2.0 loaded\n` +
    `  API: ${apiConfigured ? BRAIN_CONFIG.apiEndpoint : 'Not configured (Level 1 fallback)'}\n` +
    `  Memory: ${BRAIN_CONFIG.enableMemory ? 'Enabled' : 'Disabled'}\n` +
    `  Timeout: ${BRAIN_CONFIG.timeout}ms`
  );

})();
