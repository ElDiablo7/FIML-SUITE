(function () {
  window.GraceX = window.GraceX || {};

  const DEFAULT_STATE = {
    version: "BRAIN_V2",
    activeModule: "core",
    lastUserText: "",
    lastReply: "",
    lastIntent: "boot",
    sessionStart: Date.now(),

    // Conversation history (last 10 exchanges)
    conversation: [],
    maxConversationLength: 10,

    // Enhanced memory (session)
    memory: {
      lastTopic: "",
      userPrefs: {},
      notes: [],
      userName: "",           // If user introduces themselves
      mentionedTopics: [],    // Topics user has mentioned
      moduleVisits: {}        // Track which modules user has visited
    },

    // Emotional state tracking
    emotional: {
      mood: "neutral",        // positive | neutral | negative | anxious | stressed
      confidence: 0.5,        // 0-1 scale
      engagement: "active",   // active | passive | disengaged
      lastMoodChange: 0
    },

    // Safety lane flags (esp Uplift)
    safety: {
      level: "normal",        // normal | caution | crisis
      escalated: false,
      lastChecked: 0,
      cautionCount: 0         // Track repeated caution triggers
    },

    // Context awareness
    context: {
      timeOfDay: "",          // morning | afternoon | evening | night
      dayOfWeek: "",
      isFirstInteraction: true,
      consecutiveErrors: 0
    },

    // Debugging
    debug: {
      lastRoute: "",
      lastError: "",
      processingTime: 0
    }
  };

  // Use structuredClone if available, otherwise deep clone manually
  function deepClone(obj) {
    if (typeof structuredClone !== 'undefined') {
      return structuredClone(obj);
    }
    return JSON.parse(JSON.stringify(obj));
  }

  // Get time of day
  function getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 21) return "evening";
    return "night";
  }

  // Get day of week
  function getDayOfWeek() {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[new Date().getDay()];
  }

  // Initialize state with context
  function initState() {
    const state = deepClone(DEFAULT_STATE);
    state.context.timeOfDay = getTimeOfDay();
    state.context.dayOfWeek = getDayOfWeek();
    return state;
  }

  GraceX.state = GraceX.state || initState();

  // ═══════════════════════════════════════════════════════════════════════
  // TIME-TRAVEL DEBUGGING
  // ═══════════════════════════════════════════════════════════════════════
  
  GraceX.stateHistory = GraceX.stateHistory || [];
  const MAX_HISTORY = 50;

  function recordHistorySnapshot() {
    if (GraceX.stateHistory.length >= MAX_HISTORY) {
      GraceX.stateHistory.shift(); // Remove oldest to prevent memory bloat
    }
    GraceX.stateHistory.push({
      timestamp: Date.now(),
      state: deepClone(GraceX.state),
      meta: {
        activeModule: GraceX.state.activeModule,
        intent: GraceX.state.lastIntent,
        replyPreview: GraceX.state.lastReply?.substring(0, 30)
      }
    });
  }

  // Record initial state
  if (GraceX.stateHistory.length === 0) {
    recordHistorySnapshot();
  }

  /**
   * Rewind the brain state backwards by `steps`
   */
  GraceX.rewindState = function(steps = 1) {
    if (steps <= 0 || GraceX.stateHistory.length <= 1) return false;
    
    // Ensure we don't rewind further than we have
    const actualSteps = Math.min(steps, GraceX.stateHistory.length - 1);
    
    // Remove the future states we are rewinding past
    GraceX.stateHistory.splice(GraceX.stateHistory.length - actualSteps, actualSteps);
    
    // The new "current" state is now the last one in the history array
    const targetSnapshot = GraceX.stateHistory[GraceX.stateHistory.length - 1];
    GraceX.state = deepClone(targetSnapshot.state);
    
    console.log(`[STATE] Time-traveled backwards by ${actualSteps} frames. Now at: [${targetSnapshot.meta.activeModule}:${targetSnapshot.meta.intent}]`);
    
    // Dispatch an event so the UI knows to update
    window.dispatchEvent(new CustomEvent('GRACEX_STATE_REWIND', { 
      detail: { steps: actualSteps, state: GraceX.state } 
    }));
    
    return true;
  };

  /**
   * Get an overview of all timelines/snapshots available
   */
  GraceX.getTimelines = function() {
    return GraceX.stateHistory.map((snap, i) => ({
      index: i,
      frameOffset: GraceX.stateHistory.length - 1 - i,
      time: new Date(snap.timestamp).toLocaleTimeString(),
      module: snap.meta.activeModule,
      intent: snap.meta.intent,
      reply: snap.meta.replyPreview
    }));
  };

  // Update time context (call periodically)
  GraceX.updateContext = function() {
    GraceX.state.context.timeOfDay = getTimeOfDay();
    GraceX.state.context.dayOfWeek = getDayOfWeek();
    return GraceX.state.context;
  };

  GraceX.resetState = function () {
    GraceX.state = initState();
    return GraceX.state;
  };

  GraceX.patchState = function (patch, skipHistory = false) {
    try {
      if (!patch || typeof patch !== "object") return GraceX.state;
      
      // Record history before mutating if not skipped
      if (!skipHistory) {
        recordHistorySnapshot();
      }
      
      // Deep merge for nested objects
      GraceX.state = {
        ...GraceX.state,
        ...patch,
        memory: { ...GraceX.state.memory, ...(patch.memory || {}) },
        emotional: { ...GraceX.state.emotional, ...(patch.emotional || {}) },
        safety: { ...GraceX.state.safety, ...(patch.safety || {}) },
        context: { ...GraceX.state.context, ...(patch.context || {}) },
        debug: { ...GraceX.state.debug, ...(patch.debug || {}) }
      };
      return GraceX.state;
    } catch (e) {
      GraceX.state.debug.lastError = String(e?.message || e);
      return GraceX.state;
    }
  };

  // Add to conversation history
  GraceX.addToConversation = function(userText, aiReply, intent, module) {
    const entry = {
      timestamp: Date.now(),
      user: userText,
      ai: aiReply,
      intent: intent,
      module: module
    };
    
    GraceX.state.conversation.push(entry);
    
    // Keep only last N entries
    if (GraceX.state.conversation.length > GraceX.state.maxConversationLength) {
      GraceX.state.conversation.shift();
    }
    
    // Mark first interaction as done
    if (GraceX.state.context.isFirstInteraction) {
      GraceX.state.context.isFirstInteraction = false;
    }
    
    return entry;
  };

  // Get conversation summary for context
  GraceX.getConversationContext = function(limit = 3) {
    const recent = GraceX.state.conversation.slice(-limit);
    return recent.map(e => `User: ${e.user}\nAI: ${e.ai}`).join('\n---\n');
  };

  // Track module visit
  GraceX.trackModuleVisit = function(moduleName) {
    const visits = GraceX.state.memory.moduleVisits;
    visits[moduleName] = (visits[moduleName] || 0) + 1;
    return visits[moduleName];
  };

  // Update emotional state
  GraceX.updateMood = function(mood, confidence = null) {
    GraceX.state.emotional.mood = mood;
    GraceX.state.emotional.lastMoodChange = Date.now();
    if (confidence !== null) {
      GraceX.state.emotional.confidence = Math.max(0, Math.min(1, confidence));
    }
    return GraceX.state.emotional;
  };

  // Check if user mentioned a name (simple extraction)
  GraceX.extractUserName = function(text) {
    const patterns = [
      /my name is (\w+)/i,
      /i'm (\w+)/i,
      /call me (\w+)/i,
      /i am (\w+)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        GraceX.state.memory.userName = match[1];
        return match[1];
      }
    }
    return null;
  };

  // Get session duration in minutes
  GraceX.getSessionDuration = function() {
    return Math.floor((Date.now() - GraceX.state.sessionStart) / 60000);
  };

  // Expose utilities
  GraceX.utils = {
    getTimeOfDay,
    getDayOfWeek,
    deepClone
  };

  console.log("[GRACEX STATE] V2 loaded with conversation memory & emotional tracking");
})();
