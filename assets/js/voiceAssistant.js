// GRACE-X Voice Assistant with Wake Word
// "Ok Gracie" activates listening mode
// Extended listening duration for natural conversation
// ------------------------------

(function() {
  if (window.GRACEX_VoiceAssistant) {
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    console.warn('[GRACEX VOICE ASSISTANT] Speech recognition not supported');
    window.GRACEX_VoiceAssistant = { isSupported: false };
    return;
  }

  // ============================================
  // CONFIGURATION
  // ============================================
  
  const CONFIG = {
    // Wake words - includes both "Grace" and "Gracie" variants
    wakeWords: [
      'ok grace', 'okay grace', 'hey grace', 'oi grace', 
      'ok gracie', 'okay gracie', 'hey gracie', 'hi gracie', 
    ],
    language: 'en-GB',
    // How long to listen after wake word (milliseconds)
    activeListenDuration: 15000, // 10 seconds
    // How long to wait for speech before timing out
    silenceTimeout: 15000, // 5 seconds of silence
    // Continuous background listening for wake word
    backgroundListening: true
  };

  // ============================================
  // STATE
  // ============================================
  
  let isListening = false;
  let isActiveMode = false;
  let wakeWordRecognizer = null;
  let commandRecognizer = null;
  let activeTimeout = null;
  let silenceTimer = null;
  let statusIndicator = null;
  let lastWakeTime = 0;
  const WAKE_COOLDOWN_MS = 2500; // stops wake spam / repeated triggers

  // ============================================
  // UI - Status Indicator
  // ============================================
  
  function createStatusIndicator() {
    if (document.getElementById('gracex-voice-status')) {
      return document.getElementById('gracex-voice-status');
    }

    const indicator = document.createElement('div');
    indicator.id = 'gracex-voice-status';
    indicator.style.cssText = `
      position: fixed;
      bottom: 90px;
      right: 20px;
      padding: 12px 20px;
      background: rgba(20, 20, 30, 0.95);
      backdrop-filter: blur(10px);
      border: 2px solid #667eea;
      border-radius: 30px;
      color: #fff;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      z-index: 9997;
      display: none;
      align-items: center;
      gap: 10px;
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
      transition: all 0.3s ease;
    `;
    
    indicator.innerHTML = `
      <div class="pulse-dot" style="
        width: 12px;
        height: 12px;
        background: #10b981;
        border-radius: 50%;
        animation: gracex-pulse 1.5s infinite;
      "></div>
      <span class="status-text">Listening...</span>
    `;

    // Add pulse animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes gracex-pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.3); opacity: 0.7; }
      }
      @keyframes gracex-wave {
        0%, 100% { transform: scaleY(1); }
        50% { transform: scaleY(1.5); }
      }
      #gracex-voice-status.active {
        border-color: #10b981;
        box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
      }
      #gracex-voice-status.processing {
        border-color: #f59e0b;
      }
      #gracex-voice-status .pulse-dot.active {
        background: #10b981;
      }
      #gracex-voice-status .pulse-dot.wake {
        background: #667eea;
      }
      #gracex-voice-status .pulse-dot.processing {
        background: #f59e0b;
        animation: none;
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(indicator);
    statusIndicator = indicator;
    return indicator;
  }

  function updateStatus(state, message) {
    if (!statusIndicator) {
      statusIndicator = createStatusIndicator();
    }

    const dot = statusIndicator.querySelector('.pulse-dot');
    const text = statusIndicator.querySelector('.status-text');

    switch (state) {
      case 'wake':
        statusIndicator.style.display = 'flex';
        statusIndicator.className = '';
        dot.className = 'pulse-dot wake';
        text.textContent = message || 'Say "Ok Gracie"...';
        break;
      case 'active':
        statusIndicator.style.display = 'flex';
        statusIndicator.className = 'active';
        dot.className = 'pulse-dot active';
        text.textContent = message || '🎤 Listening...';
        break;
      case 'processing':
        statusIndicator.style.display = 'flex';
        statusIndicator.className = 'processing';
        dot.className = 'pulse-dot processing';
        text.textContent = message || 'Processing...';
        break;
      case 'hidden':
      default:
        statusIndicator.style.display = 'none';
        break;
    }
  }

  // ============================================
  // WAKE WORD DETECTION
  // ============================================
  
  function initWakeWordListener() {
    if (wakeWordRecognizer) {
      try { wakeWordRecognizer.stop(); } catch(e) {}
    }

    wakeWordRecognizer = new SpeechRecognition();
    wakeWordRecognizer.continuous = true;
    wakeWordRecognizer.interimResults = true;
    wakeWordRecognizer.lang = CONFIG.language;
    wakeWordRecognizer.maxAlternatives = 3;

    wakeWordRecognizer.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        // Only act on FINAL results to stop log spam + glitch loops
        if (!event.results[i].isFinal) continue;

        const transcript = (event.results[i][0].transcript || '').toLowerCase().trim();

        const wakeWordDetected = CONFIG.wakeWords.some(wake =>
          transcript.includes(wake)
        );

        // Cooldown prevents repeated triggers from one phrase
        const now = Date.now();
        if (wakeWordDetected && !isActiveMode && (now - lastWakeTime) > WAKE_COOLDOWN_MS) {
          lastWakeTime = now;
          console.log('[GRACEX VOICE] Wake word detected:', transcript);

          // Stop wake word listener before speaking/active mode
          try { wakeWordRecognizer.stop(); } catch(e) {}

          const go = () => startActiveListening();

          // Don't speak over listening — keep ack short
          if (window.GRACEX_TTS && typeof window.GRACEX_TTS.isEnabled === 'function' && window.GRACEX_TTS.isEnabled()) {
            if (typeof window.GRACEX_TTS.stop === 'function') window.GRACEX_TTS.stop();
            window.GRACEX_TTS.speak("Yes?").then(go).catch(go);
          } else {
            go();
          }
          return;
        }
      }
    };

    wakeWordRecognizer.onerror = (event) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.warn('[GRACEX VOICE] Wake word error:', event.error);
      }
      // Restart wake word listening after error
      if (CONFIG.backgroundListening && !isActiveMode) {
        setTimeout(() => {
          try { startWakeWordListening(); } catch(e) {}
        }, 1000);
      }
    };

    wakeWordRecognizer.onend = () => {
      // Restart wake word listening if not in active mode
      if (CONFIG.backgroundListening && !isActiveMode) {
        setTimeout(() => {
          try { startWakeWordListening(); } catch(e) {}
        }, 500);
      }
    };
  }

  function startWakeWordListening() {
    if (isActiveMode) return;
    
    try {
      initWakeWordListener();
      wakeWordRecognizer.start();
      isListening = true;
        console.log('[GRACEX VOICE] Wake word listener active - say "Hey Grace" or "Gracie"');
    } catch (err) {
      console.warn('[GRACEX VOICE] Could not start wake word listener:', err);
    }
  }

  function stopWakeWordListening() {
    if (wakeWordRecognizer) {
      try { wakeWordRecognizer.stop(); } catch(e) {}
    }
    isListening = false;
  }

  // ============================================
  // ACTIVE LISTENING MODE
  // ============================================
  
  function startActiveListening() {
    // While listening, stop any speech to prevent talking-over / cutting you off
    if (window.GRACEX_TTS && typeof window.GRACEX_TTS.stop === 'function') window.GRACEX_TTS.stop();
    isActiveMode = true;
    updateStatus('active', '🎤 Listening...');

    // Stop any existing command recognizer
    if (commandRecognizer) {
      try { commandRecognizer.stop(); } catch(e) {}
    }

    commandRecognizer = new SpeechRecognition();
    commandRecognizer.continuous = true;  // Keep listening
    commandRecognizer.interimResults = true;  // Show partial results
    commandRecognizer.lang = CONFIG.language;
    commandRecognizer.maxAlternatives = 1;

    let finalTranscript = '';
    let lastSpeechTime = Date.now();
    const activeStart = Date.now();
    let hasProcessed = false;

    commandRecognizer.onresult = (event) => {
      lastSpeechTime = Date.now();
      
      // Reset silence timer
      if (silenceTimer) clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => {
        // Don't cut the user off early. We only *consider* ending once the full active window has elapsed.
        const elapsed = Date.now() - activeStart;
        if (elapsed >= CONFIG.activeListenDuration) {
          if (!hasProcessed && finalTranscript.trim()) {
            hasProcessed = true;
            processCommand(finalTranscript.trim());
          }
          endActiveListening();
          return;
        }

        // Still inside the active window — keep listening.
        // Re-arm the timer so we can keep checking without stopping the recognizer.
        if (silenceTimer) clearTimeout(silenceTimer);
        silenceTimer = setTimeout(() => {}, 0); // no-op; real timeout is controlled by the main active timer
      }, CONFIG.silenceTimeout);

      // Build transcript
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      // Update status with what's being heard
      const displayText = (finalTranscript + interimTranscript).trim();
      if (displayText) {
        updateStatus('active', '🎤 ' + displayText.substring(0, 50) + (displayText.length > 50 ? '...' : ''));
      }
    };

    commandRecognizer.onerror = (event) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.warn('[GRACEX VOICE] Command recognition error:', event.error);
      }
      
      // If we have partial transcript, process it
      if (!hasProcessed && finalTranscript.trim()) {
        hasProcessed = true;
        processCommand(finalTranscript.trim());
      }
      endActiveListening();
    };

    commandRecognizer.onend = () => {
      // If still in active mode and have transcript, process it
      if (isActiveMode && !hasProcessed && finalTranscript.trim()) {
        hasProcessed = true;
        processCommand(finalTranscript.trim());
      }
      endActiveListening();
    };

    try {
      commandRecognizer.start();
      console.log('[GRACEX VOICE] Active listening started - speak now');
      
      // Set maximum listen duration
      activeTimeout = setTimeout(() => {
        if (!hasProcessed && finalTranscript.trim()) {
        hasProcessed = true;
        processCommand(finalTranscript.trim());
      }
      endActiveListening();
      }, CONFIG.activeListenDuration);
      
    } catch (err) {
      console.warn('[GRACEX VOICE] Could not start active listening:', err);
      endActiveListening();
    }
  }

  function endActiveListening() {
    isActiveMode = false;
    
    // Clear timers
    if (activeTimeout) clearTimeout(activeTimeout);
    if (silenceTimer) clearTimeout(silenceTimer);
    
    // Stop command recognizer
    if (commandRecognizer) {
      try { commandRecognizer.stop(); } catch(e) {}
    }
    
    updateStatus('hidden');
    
    // Restart wake word listening
    if (CONFIG.backgroundListening) {
      setTimeout(() => {
        startWakeWordListening();
      }, 1000);
    }
  }

  // ============================================
  // COMMAND PROCESSING
  // ============================================
  
  async function processCommand(text) {
    console.log('[GRACEX VOICE] Processing command:', text);
    updateStatus('processing', 'Thinking...');

    // Remove wake word from start if present
    let cleanText = text;
    CONFIG.wakeWords.forEach(wake => {
      const regex = new RegExp('^' + wake + '\\s*', 'i');
      cleanText = cleanText.replace(regex, '');
    });
    cleanText = cleanText.trim();

    if (!cleanText) {
      if (window.GRACEX_TTS && window.GRACEX_TTS.isEnabled()) {
        window.GRACEX_TTS.speak("I didn't catch that. Try again?");
      }
      return;
    }

    // Retrieve voice context from Omni-Brain
    let contextHistory = [];
    if (window.GraceX && window.GraceX.RAM) {
      contextHistory = window.GraceX.RAM.getBuffer("voice_context") || [];
    }

    // Try to get response from brain
    let result;
    try {
      // Build context-aware string instead of just the isolated text
      const fullContextString = contextHistory.length > 0
        ? `[Conversation History: ${contextHistory.join(" | ")}] User says: ${cleanText}`
        : cleanText;

      if (window.GraceX && typeof window.GraceX.think === 'function') {
        const res = window.GraceX.think({
          text: fullContextString,
          module: 'core',
          mode: 'voice',
          originalText: cleanText // Keep original for display
        });
        result = res.reply || "I heard you, but I'm not sure how to respond.";
      } else if (typeof window.runModuleBrain === 'function') {
        const reply = window.runModuleBrain('core', fullContextString);
        if (reply && typeof reply.then === 'function') {
          result = await reply;
        } else {
          result = reply;
        }
      } else {
        result = "I heard: " + cleanText + ". But my brain isn't fully connected right now.";
      }

      // Save new context back to Omni-Brain with a 15 min TTL
      if (window.GraceX && window.GraceX.RAM) {
        contextHistory.push(cleanText);
        if (contextHistory.length > 5) contextHistory.shift(); // Keep last 5
        window.GraceX.RAM.setBuffer("voice_context", contextHistory, { ttl: 15 * 60 * 1000 });
      }

    } catch (err) {
      console.warn('[GRACEX VOICE] Brain error:', err);
      result = "Sorry, I had trouble processing that.";
    }

    // Update state
    if (window.GRACEX_CORE_STATE) {
      window.GRACEX_CORE_STATE.lastHeard = cleanText;
      window.GRACEX_CORE_STATE.lastReply = result;
      window.GRACEX_CORE_STATE.lastIntent = 'voice_assistant';
    }

    // Also route command if available
    if (window.GRACEX_Core && typeof window.GRACEX_Core.routeCommand === 'function') {
      window.GRACEX_Core.routeCommand(cleanText);
    }

    // Speak the response
    if (window.GRACEX_TTS && window.GRACEX_TTS.isEnabled() && result) {
      await window.GRACEX_TTS.speak(result).catch(err => {
        console.warn('[GRACEX VOICE] TTS error:', err);
      });
    }

    updateStatus('hidden');
  }

  // ============================================
  // MANUAL ACTIVATION (for mic buttons)
  // ============================================
  
  function manualActivate() {
    // Stop wake word listener
    stopWakeWordListening();
    
    // Start active listening directly
    if (window.GRACEX_TTS && window.GRACEX_TTS.isEnabled()) {
      window.GRACEX_TTS.speak("I'm listening.").then(() => {
        startActiveListening();
      }).catch(() => {
        startActiveListening();
      });
    } else {
      startActiveListening();
    }
  }

  // ============================================
  // PUBLIC API
  // ============================================
  
  function start() {
    if (!SpeechRecognition) {
      console.warn('[GRACEX VOICE] Speech recognition not supported');
      return false;
    }
    
    createStatusIndicator();
    startWakeWordListening();
      console.log('[GRACEX VOICE ASSISTANT] Started - say "Hey Grace" or "Gracie" to activate');
    return true;
  }

  function stop() {
    CONFIG.backgroundListening = false;
    stopWakeWordListening();
    endActiveListening();
    updateStatus('hidden');
    console.log('[GRACEX VOICE ASSISTANT] Stopped');
  }

  function toggle() {
    if (isListening || isActiveMode) {
      stop();
      return false;
    } else {
      CONFIG.backgroundListening = true;
      start();
      return true;
    }
  }

  // ============================================
  // INITIALIZATION
  // ============================================
  
  window.GRACEX_VoiceAssistant = {
    start,
    stop,
    toggle,
    activate: manualActivate,
    isListening: () => isListening,
    isActive: () => isActiveMode,
    isSupported: true,
    setListenDuration: (ms) => { CONFIG.activeListenDuration = ms; },
    setSilenceTimeout: (ms) => { CONFIG.silenceTimeout = ms; }
  };

  // Auto-start after a short delay (let other systems initialize)
  setTimeout(() => {
    // Only auto-start if the app has loaded (boot is hidden)
    const boot = document.getElementById('boot');
    const shouldStart = !boot || boot.style.display === 'none';
    
    if (shouldStart) {
      // Request microphone permission immediately
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
          console.log('[GRACEX VOICE] Microphone access granted');
          start();
          // Show activation message
          if (statusIndicator) {
            updateStatus('wake', '🎤 Say "Hey Gracie" to talk!');
            setTimeout(() => updateStatus('hidden'), 5000);
          }
        })
        .catch((err) => {
          console.warn('[GRACEX VOICE] Microphone access denied:', err);
          // Show helpful message
          if (statusIndicator) {
            updateStatus('processing', '❌ Click mic button to enable voice');
            setTimeout(() => updateStatus('hidden'), 5000);
          }
        });
    } else {
      // Wait for boot to complete
      const observer = new MutationObserver((mutations) => {
        if (boot.style.display === 'none') {
          observer.disconnect();
          // Request permission after boot
          navigator.mediaDevices.getUserMedia({ audio: true })
            .then(() => {
              start();
              updateStatus('wake', '🎤 Ready! Say "Hey Gracie"');
              setTimeout(() => updateStatus('hidden'), 5000);
            })
            .catch(() => {
              updateStatus('processing', '❌ Click mic to enable');
              setTimeout(() => updateStatus('hidden'), 5000);
            });
        }
      });
      observer.observe(boot, { attributes: true, attributeFilter: ['style'] });
    }
  }, 2000);

  console.info('[GRACEX VOICE ASSISTANT] Loaded - Wake words: "Hey Grace", "Ok Grace", "Hey Gracie", "Ok Gracie"');
})();