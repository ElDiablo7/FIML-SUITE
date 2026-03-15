(function () {
  window.GraceX = window.GraceX || {};

  // =====================================
  // ACTION EXECUTOR
  // =====================================
  function executeActions(actions) {
    if (!actions || !Array.isArray(actions) || actions.length === 0) return;
    
    for (const action of actions) {
      try {
        switch (action.type) {
          case "NAVIGATE":
            // Trigger SPA navigation if router available
            if (window.GRACEX_Router && typeof window.GRACEX_Router.loadModule === 'function') {
              console.log("[GRACEX BRAIN] Navigating to:", action.to);
              window.GRACEX_Router.loadModule(action.to);
            } else if (action.to) {
              // Fallback: direct navigation
              console.log("[GRACEX BRAIN] Direct navigation to:", action.to);
              window.location.href = action.to;
            }
            break;
            
          case "SPEAK":
            // Trigger TTS
            if (window.GRACEX_TTS && window.GRACEX_TTS.isEnabled()) {
              window.GRACEX_TTS.speak(action.text);
            }
            break;
            
          case "PLAY_AUDIO":
            // Play audio file
            if (window.GRACEX_AudioManager) {
              window.GRACEX_AudioManager.play(action.key);
            }
            break;
            
          case "UPDATE_UI":
            // Update a UI element
            const el = document.getElementById(action.elementId);
            if (el) {
              if (action.text) el.textContent = action.text;
              if (action.html) el.innerHTML = action.html;
              if (action.className) el.className = action.className;
              if (action.style) Object.assign(el.style, action.style);
            }
            break;
            
          case "DISPATCH_EVENT":
            // Dispatch custom event
            window.dispatchEvent(new CustomEvent(action.eventName, { detail: action.detail }));
            break;
            
          default:
            console.log("[GRACEX BRAIN] Unknown action type:", action.type);
        }
      } catch (err) {
        console.warn("[GRACEX BRAIN] Action execution error:", err);
      }
    }
  }

  // =====================================
  // API INTEGRATION HOOKS (Async)
  // =====================================
  GraceX.API_REGISTRY = {};

  GraceX.registerAPI = function(intent, handler) {
    if (typeof handler !== 'function') return false;
    GraceX.API_REGISTRY[intent] = handler;
    console.log(`[GRACEX BRAIN] API Registered for intent: ${intent}`);
    return true;
  };

  GraceX.invokeAPI = async function(intent, payload) {
    if (!GraceX.API_REGISTRY[intent]) return null;
    
    try {
      console.log(`[GRACEX BRAIN] Invoking API for intent: ${intent}`);
      return await GraceX.API_REGISTRY[intent](payload);
    } catch (e) {
      console.error(`[GRACEX BRAIN] API Invocation Error for ${intent}:`, e);
      return null;
    }
  };

  // =====================================
  // MAIN THINK FUNCTION (V3 - Async)
  // =====================================
  GraceX.think = async function (input) {
    const startTime = Date.now();
    
    try {
      const moduleName = (input?.module || "core").toLowerCase();
      const text = (input?.text || "").trim();
      const mode = input?.mode || "chat";

      // Update context (time of day, etc.)
      GraceX.updateContext?.();

      // Patch state: incoming
      GraceX.patchState({
        activeModule: moduleName,
        lastUserText: text
      });

      // Route the input
      let res = GraceX.route ? GraceX.route(input) : { 
        reply: "No internal router found.", 
        intent: "unknown", 
        actions: [], 
        safety: { level: 'normal' } 
      };

      // Handle External API Override if the resolved intent maps to an API hook
      if (GraceX.API_REGISTRY[res.intent]) {
        // We halt synchronous rendering and await the API
        const apiResponse = await GraceX.invokeAPI(res.intent, { input, routeResult: res });
        if (apiResponse) {
          res = { ...res, ...apiResponse }; // Merge API overrides (e.g. data appended to reply)
        }
      }

      // Execute any actions from the response
      if (res.actions && res.actions.length > 0) {
        executeActions(res.actions);
      }

      // Patch state: outgoing
      const processingTime = Date.now() - startTime;
      GraceX.patchState({
        lastReply: res.reply,
        lastIntent: res.intent,
        memory: res.memoryPatch ? { ...GraceX.state.memory, ...res.memoryPatch } : GraceX.state.memory,
        safety: { ...GraceX.state.safety, ...res.safety, lastChecked: Date.now() },
        debug: { 
          ...GraceX.state.debug, 
          lastRoute: `${moduleName}:${res.intent}`,
          processingTime
        }
      });

      // Log for debugging
      if (GraceX.state?.debug) {
        console.log(`[GRACEX THINK] ${moduleName}:${res.intent} (${processingTime}ms)`, {
          emotion: res.emotion,
          safety: res.safety.level,
          hasActions: res.actions.length > 0
        });
      }

      return res;
      
    } catch (e) {
      const processingTime = Date.now() - startTime;
      console.error("[GRACEX BRAIN] Think error:", e);
      
      GraceX.patchState({ 
        debug: { 
          lastError: String(e?.message || e),
          processingTime
        },
        context: {
          consecutiveErrors: (GraceX.state?.context?.consecutiveErrors || 0) + 1
        }
      });
      
      return {
        ok: false,
        reply: "I hit a brain error. Check console for details.",
        intent: "error",
        emotion: { mood: "neutral", confidence: 0 },
        module: (input?.module || "core"),
        actions: [],
        memoryPatch: {},
        safety: { level: "normal", escalated: false },
        meta: { processingTime, error: true }
      };
    }
  };

  // =====================================
  // QUICK HELPERS
  // =====================================
  
  // Quick ask - simple text in, reply out
  GraceX.ask = function(text, module = "core") {
    const res = GraceX.think({ text, module, mode: "chat" });
    return res.reply;
  };

  // Get current mood
  GraceX.getMood = function() {
    return GraceX.state?.emotional?.mood || "neutral";
  };

  // Check if user needs support (Uplift-specific)
  GraceX.needsSupport = function() {
    const safety = GraceX.state?.safety;
    return safety?.level === "caution" || safety?.level === "crisis";
  };

  // Get conversation history
  GraceX.getHistory = function(limit = 5) {
    return GraceX.state?.conversation?.slice(-limit) || [];
  };

  // Clear conversation (start fresh)
  GraceX.clearConversation = function() {
    if (GraceX.state) {
      GraceX.state.conversation = [];
    }
    return true;
  };

  // Debug: show current state
  GraceX.debug = function() {
    console.log("[GRACEX STATE]", GraceX.state);
    return GraceX.state;
  };

  console.log("[GRACEX BRAIN] V2 loaded with action execution & helpers");
})();
