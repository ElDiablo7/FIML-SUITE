// GRACE-X Brain V5 Helper
// Standardized brain panel functionality for all modules
// Handles async Level 5 brains, loading states, and clear conversation
// COMPREHENSIVE WIRING FIX - V7.1
// ------------------------------

(function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════════
  // BUTTON ID MAPPINGS - Handles variations in element IDs across modules
  // ═══════════════════════════════════════════════════════════════════════════
  const BUTTON_ID_ALIASES = {
    'core': {
      send: ['core-brain-btn', 'core-brain-send'],
      input: ['core-brain-input'],
      mic: ['core-brain-mic'],
      clear: ['core-brain-clear'],
      output: ['core-brain-output']
    }
  };

  // Get element by trying multiple IDs
  function getElement(moduleId, type, fallbackId) {
    const aliases = BUTTON_ID_ALIASES[moduleId];
    if (aliases && aliases[type]) {
      for (const id of aliases[type]) {
        const el = document.getElementById(id);
        if (el) return el;
      }
    }
    // Try standard pattern
    const standardId = moduleId + '-brain-' + (type === 'send' ? 'send' : type);
    const standard = document.getElementById(standardId);
    if (standard) return standard;
    
    // Try fallback
    if (fallbackId) {
      return document.getElementById(fallbackId);
    }
    return null;
  }

  // Initialize v5 brain panel for a module
  window.initBrainV5 = function(moduleId, options) {
    options = options || {};
    const panel = document.getElementById(moduleId + '-brain-panel');
    
    // Handle button ID variations
    const input = getElement(moduleId, 'input') || 
                  document.getElementById(moduleId + '-brain-input');
    const send = getElement(moduleId, 'send') || 
                 document.getElementById(moduleId + '-brain-send') || 
                 document.getElementById(moduleId + '-brain-btn');
    const output = getElement(moduleId, 'output') || 
                   document.getElementById(moduleId + '-brain-output');
    const clearBtn = getElement(moduleId, 'clear') || 
                     document.getElementById(moduleId + '-brain-clear');
    const exportBtn = document.getElementById(moduleId + '-brain-export');

    if (!panel || !input || !send || !output) {
      // Only log if we found at least one element (partial wiring)
      if (panel || input || send || output) {
        console.warn('[GRACEX Brain V5] Partial elements found for', moduleId, 
          { panel: !!panel, input: !!input, send: !!send, output: !!output });
      }
      return false;
    }

    // Prevent double initialization
    if (send.dataset.brainV5Initialized === '1') {
      return true;
    }

    let isLoading = false;

    function appendMessage(role, text) {
      const message = document.createElement('div');
      message.className = 'brain-message brain-message-' + role;
      message.textContent = text;
      output.appendChild(message);
      output.scrollTop = output.scrollHeight;
    }

    function setLoading(loading) {
      isLoading = loading;
      if (loading) {
        send.disabled = true;
        send.textContent = 'Thinking...';
        const loadingMsg = document.createElement('div');
        loadingMsg.className = 'brain-message brain-message-system';
        loadingMsg.id = moduleId + '-brain-loading';
        loadingMsg.textContent = 'Thinking...';
        output.appendChild(loadingMsg);
        output.scrollTop = output.scrollHeight;
      } else {
        send.disabled = false;
        send.textContent = 'Ask';
        const loadingMsg = document.getElementById(moduleId + '-brain-loading');
        if (loadingMsg) {
          loadingMsg.remove();
        }
      }
    }

    async function handleQuestion() {
      const q = input.value.trim();
      if (!q || isLoading) return;

      input.value = '';
      appendMessage('user', q);
      setLoading(true);

      try {
        // Try Level 5 brain (runModuleBrain) FIRST for API connection, then fallback to GraceX.think
        let result;
        if (window.runModuleBrain) {
          const reply = window.runModuleBrain(moduleId, q);
          // Handle both sync (Level 1) and async (Level 5) responses
          if (reply && typeof reply.then === 'function') {
            result = await reply;
          } else {
            result = reply;
          }
        } else if (window.GraceX && typeof window.GraceX.think === 'function') {
          // Fallback to local GraceX.think if runModuleBrain not available
          const res = window.GraceX.think({
            text: q,
            module: moduleId,
            mode: 'chat'
          });
          result = res.reply || res.message || "I'm not sure how to respond to that.";
        } else {
          result = "Brain system not available.";
        }
        
        setLoading(false);
        appendMessage('ai', result);
        
        // Speak the response using TTS
        if (window.GRACEX_TTS && window.GRACEX_TTS.isEnabled()) {
          window.GRACEX_TTS.speak(result).catch(err => {
            console.warn('[GRACEX Brain V5] TTS error:', err);
          });
        }
      } catch (err) {
        console.error('[GRACEX Brain V5] Error for', moduleId, err);
        setLoading(false);
        appendMessage('ai', 'Sorry, something went wrong. Please try again.');
      }
    }

    // Clear conversation
    if (clearBtn) {
      clearBtn.addEventListener('click', function() {
        output.innerHTML = '';
        if (window.clearBrainHistory) {
          window.clearBrainHistory(moduleId);
        }
        // Add welcome message if provided
        if (options.welcomeMessage) {
          const welcome = document.createElement('div');
          welcome.className = 'brain-message brain-message-system';
          welcome.textContent = options.welcomeMessage;
          output.appendChild(welcome);
        }
      });
    }

    // Export conversation
    if (exportBtn) {
      exportBtn.addEventListener('click', function() {
        const messages = output.querySelectorAll('.brain-message');
        if (messages.length === 0) return;
        let chatText = `GRACE-X ${moduleId.toUpperCase()} CHAT EXPORT\n`;
        chatText += `Generated: ${new Date().toLocaleString()}\n\n`;
        messages.forEach(msg => {
          const role = msg.classList.contains('brain-message-user') ? 'You' : 
                       msg.classList.contains('brain-message-system') ? 'System' : 'GRACE';
          chatText += `[${role}]: ${msg.textContent.trim()}\n\n`;
        });
        const blob = new Blob([chatText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `GRACEX_${moduleId}_chat_export.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }

    // Send button
    send.addEventListener('click', handleQuestion);

    // Enter key
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleQuestion();
      }
    });

    // Mark as initialized
    send.dataset.brainV5Initialized = '1';

    return true;
  };

  // setupModuleBrain - handles explicit element IDs (used by builder, siteops, etc.)
  window.setupModuleBrain = function(moduleId, options) {
    options = options || {};
    const panel = document.getElementById(options.panelId || moduleId + '-brain-panel');
    const input = document.getElementById(options.inputId || moduleId + '-brain-input');
    const send = document.getElementById(options.sendId || moduleId + '-brain-send');
    const output = document.getElementById(options.outputId || moduleId + '-brain-output');
    const clearBtn = options.clearId ? document.getElementById(options.clearId) : null;
    const exportBtn = document.getElementById(options.exportId || moduleId + '-brain-export');

    if (!panel || !input || !send || !output) {
      console.warn('[GRACEX Brain V5] Missing elements for module', moduleId);
      return false;
    }

    // Prevent double initialization
    if (send.dataset.brainWired === "1") {
      return true;
    }
    send.dataset.brainWired = "1";

    // Display initial message if provided and output is empty
    if (options.initialMessage && !output.textContent.trim()) {
      const initialMsg = document.createElement("div");
      initialMsg.className = "brain-message brain-message-ai";
      initialMsg.textContent = options.initialMessage;
      output.appendChild(initialMsg);
    }

    function appendMessage(role, text) {
      const row = document.createElement("div");
      row.className = `brain-message brain-message-${role}`;
      row.textContent = text;
      output.appendChild(row);
      output.scrollTop = output.scrollHeight;
    }

    async function handleAsk() {
      const q = (input.value || "").trim();
      if (!q) return;

      appendMessage("user", q);
      input.value = ""; // Clear input immediately

      // Show thinking state
      const thinkingRow = document.createElement("div");
      thinkingRow.className = "brain-message brain-message-ai brain-message-thinking";
      thinkingRow.textContent = "Thinking...";
      output.appendChild(thinkingRow);
      output.scrollTop = output.scrollHeight;

      try {
        // Try Level 5 brain (runModuleBrain) FIRST for API connection, then fallback to GraceX.think
        let reply;
        if (window.runModuleBrain) {
          const brainReply = window.runModuleBrain(moduleId, q);
          // Handle both sync and async
          if (brainReply && typeof brainReply.then === 'function') {
            reply = await brainReply;
          } else {
            reply = brainReply;
          }
        } else if (window.GraceX && typeof window.GraceX.think === 'function') {
          // Fallback to local GraceX.think if runModuleBrain not available
          const res = window.GraceX.think({
            text: q,
            module: moduleId,
            mode: 'chat'
          });
          reply = res.reply || res.message || "I'm not sure how to respond to that.";
        } else {
          reply = "Brain system not available.";
        }
        
        // Remove thinking state
        if (thinkingRow.parentNode) {
          thinkingRow.parentNode.removeChild(thinkingRow);
        }
        appendMessage("ai", reply || "(no reply)");
        
        // Speak the response using TTS
        if (window.GRACEX_TTS && window.GRACEX_TTS.isEnabled() && reply) {
          window.GRACEX_TTS.speak(reply).catch(err => {
            console.warn(`[GRACEX ${moduleId.toUpperCase()}] TTS error:`, err);
          });
        }
      } catch (err) {
        console.error(`[GRACEX ${moduleId.toUpperCase()}] Brain error:`, err);
        // Remove thinking state
        if (thinkingRow.parentNode) {
          thinkingRow.parentNode.removeChild(thinkingRow);
        }
        appendMessage("ai", "Sorry, something glitched in my brain. Please try again.");
      }
    }

    send.addEventListener("click", handleAsk);

    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" && !ev.shiftKey) {
        ev.preventDefault();
        handleAsk();
      }
    });

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        output.innerHTML = ''; // Clear UI output
        if (window.GRACEX_Level5Brain && typeof window.GRACEX_Level5Brain.clearHistory === 'function') {
          window.GRACEX_Level5Brain.clearHistory(moduleId); // Clear memory
        }
        if (options.initialMessage) {
          appendMessage('ai', options.initialMessage); // Re-add initial message
        }
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const messages = output.querySelectorAll('.brain-message');
        if (messages.length === 0) return;
        let chatText = `GRACE-X ${moduleId.toUpperCase()} CHAT EXPORT\n`;
        chatText += `Generated: ${new Date().toLocaleString()}\n\n`;
        messages.forEach(msg => {
          const role = msg.classList.contains('brain-message-user') ? 'You' : 
                       msg.classList.contains('brain-message-system') ? 'System' : 'GRACE';
          chatText += `[${role}]: ${msg.textContent.trim()}\n\n`;
        });
        const blob = new Blob([chatText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `GRACEX_${moduleId}_chat_export.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }

    return true;
  };

  // Wire up brain mic button for voice input
  window.wireBrainMic = function(moduleId) {
    const micBtn = document.getElementById(moduleId + '-brain-mic');
    const input = document.getElementById(moduleId + '-brain-input');
    const sendBtn = document.getElementById(moduleId + '-brain-send') || document.getElementById(moduleId + '-brain-btn');
    
    if (!micBtn || !input) {
      return false;
    }
    
    // Prevent double initialization
    if (micBtn.dataset.wired === '1') {
      return true;
    }
    micBtn.dataset.wired = '1';
    
    // Check for Speech Recognition API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      micBtn.title = 'Voice input not supported in this browser';
      micBtn.style.opacity = '0.5';
      return false;
    }
    
    let recognition = null;
    // IMPORTANT:
    // - isListening controls UI state
    // - shouldListen represents user intent (toggle ON/OFF)
    //   Browsers (especially Chrome/Android) can end SpeechRecognition at any time.
    //   If shouldListen=true we auto-restart, instead of instantly turning the mic off.
    let isListening = false;
    let shouldListen = false;
    let isStopping = false;
    let silenceTimer = null;
    const SILENCE_DURATION = 2500; // 2.5 seconds of silence before auto-stop

    // If the wake-word assistant is running, it can steal the mic and instantly end this recognizer.
    // We pause it while the brain mic is active, then resume afterwards.
    let resumeVoiceAssistantAfter = false;

    function pauseOtherVoiceSystems() {
      try {
        if (window.GRACEX_VoiceAssistant && typeof window.GRACEX_VoiceAssistant.stop === 'function') {
          if (window.GRACEX_VoiceAssistant.isListening?.() || window.GRACEX_VoiceAssistant.isActive?.()) {
            resumeVoiceAssistantAfter = true;
          }
          window.GRACEX_VoiceAssistant.stop();
        }
      } catch (e) {}
    }

    function resumeOtherVoiceSystems() {
      try {
        if (resumeVoiceAssistantAfter && window.GRACEX_VoiceAssistant && typeof window.GRACEX_VoiceAssistant.start === 'function') {
          setTimeout(() => {
            try { window.GRACEX_VoiceAssistant.start(); } catch (e) {}
          }, 350);
        }
      } catch (e) {}
      resumeVoiceAssistantAfter = false;
    }

    function setMicUI(listening) {
      isListening = listening;
      if (listening) {
        micBtn.classList.add('listening');
        micBtn.textContent = '🔴';
        input.placeholder = 'Listening... (click mic to stop)';
      } else {
        micBtn.classList.remove('listening');
        micBtn.textContent = '🎙️';
        input.placeholder = input.dataset.originalPlaceholder || 'Ask a question...';
      }
    }

    function cleanupRecognition() {
      if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
      }
      if (recognition) {
        try { recognition.onstart = null; recognition.onresult = null; recognition.onerror = null; recognition.onend = null; } catch(e) {}
        try { recognition.stop(); } catch(e) {}
      }
      recognition = null;
    }

    function createRecognition() {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      recognition.lang = 'en-GB';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = function() {
        setMicUI(true);
      };

      recognition.onresult = function(event) {
        // Clear silence timer when we get speech
        if (silenceTimer) {
          clearTimeout(silenceTimer);
          silenceTimer = null;
        }

        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        input.value = transcript;

        // Start new silence timer
        silenceTimer = setTimeout(() => {
          if (shouldListen && input.value.trim()) {
            console.log('[GRACEX Brain Mic] Silence detected, stopping (auto-send)...');
            stopListening(true); // auto-send
          }
        }, SILENCE_DURATION);
      };

      recognition.onerror = function(event) {
        const err = event && event.error ? event.error : 'unknown';
        console.warn('[GRACEX Brain Mic] Error:', err);

        // Common transient errors on Android/Chrome when another recognizer is active.
        // If the user still wants to listen, we try a restart.
        if (shouldListen && (err === 'aborted' || err === 'no-speech' || err === 'audio-capture')) {
          setTimeout(() => {
            if (shouldListen) {
              try { recognition && recognition.start(); } catch(e) {}
            }
          }, 250);
          return;
        }

        // Permission / hard failures -> turn off
        if (err === 'not-allowed' || err === 'service-not-allowed') {
          shouldListen = false;
        }
        stopListening();
      };

      recognition.onend = function() {
        // If we intentionally stopped, just clean up.
        if (isStopping) {
          isStopping = false;
          if (!shouldListen) {
            setMicUI(false);
            cleanupRecognition();
            resumeOtherVoiceSystems();
          }
          return;
        }

        // Browser ended recognition (VERY common). If user toggle is ON, auto-restart.
        if (shouldListen) {
          setTimeout(() => {
            if (!shouldListen) return;
            try {
              // Recreate to avoid "recognition has already started" edge cases
              cleanupRecognition();
              createRecognition();
              recognition.start();
            } catch (e) {
              console.warn('[GRACEX Brain Mic] Auto-restart failed:', e);
              stopListening();
            }
          }, 180);
        } else {
          setMicUI(false);
          cleanupRecognition();
          resumeOtherVoiceSystems();
        }
      };
    }
    
    function startListening() {
      if (shouldListen) return;
      shouldListen = true;
      pauseOtherVoiceSystems();

      try {
        cleanupRecognition();
        createRecognition();
        recognition.start();
      } catch (e) {
        console.error('[GRACEX Brain Mic] Failed to start:', e);
        shouldListen = false;
        setMicUI(false);
        cleanupRecognition();
        resumeOtherVoiceSystems();
      }
    }
    
    function stopListening(autoSend = false) {
      shouldListen = false;
      isStopping = true;
      setMicUI(false);

      // Clear silence timer
      if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
      }

      if (recognition) {
        try { recognition.stop(); } catch (e) {}
      }

      // Auto-send if we got text and autoSend is true
      if (autoSend && input.value.trim() && sendBtn) {
        setTimeout(() => sendBtn.click(), 120);
      }

      // Resume wake-word assistant after we fully stop
      setTimeout(() => {
        cleanupRecognition();
        resumeOtherVoiceSystems();
      }, 250);
    }
    
    // Store original placeholder
    input.dataset.originalPlaceholder = input.placeholder;
    
    // Use pointerdown to keep this a "real" user gesture on mobile browsers
    micBtn.addEventListener('pointerdown', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (shouldListen) {
        stopListening();
      } else {
        startListening();
      }
    });
    
    console.info(`[GRACEX Brain Mic] Wired for module: ${moduleId}`);
    return true;
  };
  
  // Common module IDs that have brain panels
  const ALL_MODULE_IDS = [
    'core', 'builder', 'siteops', 'tradelink', 'beauty', 
    'fit', 'yoga', 'uplift', 'chef', 'artist', 
    'family', 'gamer', 'accounting', 'account', 'osint', 'sport', 'guardian'
  ];

  // Wire all available brain mics
  function wireAllBrainMics() {
    ALL_MODULE_IDS.forEach(id => {
      window.wireBrainMic(id);
    });
  }

  // Auto-wire all brain mic buttons on DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    wireAllBrainMics();
  });
  
  // CRITICAL: Also wire mics when modules are loaded via SPA router
  document.addEventListener('gracex:module:loaded', function(event) {
    const moduleId = event.detail && event.detail.module;
    if (moduleId) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        window.wireBrainMic(moduleId);
        // Also try to init brain panel
        window.initBrainV5(moduleId);
      }, 100);
    }
  });
  
  // Expose for manual wiring
  window.wireAllBrainMics = wireAllBrainMics;

  console.info('[GRACEX] Brain V5 Helper loaded');
})();

