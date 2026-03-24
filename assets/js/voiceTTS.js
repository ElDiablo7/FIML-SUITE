// assets/js/voiceTTS.js
// GRACE-X AI™ Voice & Character Engine v3.0
// Implements the VOICE & CHARACTER MASTER SPEC
// © Zac Crockett
//
// GRACE-X AI™ Voice Profile (LOCKED):
// - Accent: UK English, neutral/soft South-East
// - Tone: Calm, warm, reassuring, controlled, never rushed
// - Pace: Slightly slower than default
// - Pitch: Mid-low female register, no "AI sparkle"
// - Cadence: Natural pauses, short sentences when needed

(function () {
  if (window.GRACEX_TTS) {
    return;
  }

  let isEnabled = true;
  let isSpeaking = false;
  let currentUtterance = null;
  let currentModule = 'core';
  let crisisMode = false;
  
  // ============================================
  // GRACE VOICE SPEC (OFFICIAL - LOCKED)
  // ============================================
  // "Calm, confident UK-English female voice. Mid pitch. 
  //  Clean tone. Controlled pace. Authoritative but warm. 
  //  Clear diction. No fluff."
  //
  // Gender: Female | Age: late-20s to late-30s
  // Accent: UK English (neutral London)
  // Pitch: mid-range | Speed: medium-fast
  // Presence: confident, centred, composed
  // Think: calm authority, NOT friendly assistant
  
  let voiceSettings = {
    rate: 1.10,        // Medium-fast (spec: deliberate, rhythmic)
    pitch: 1.15,       // Mid-range female
    volume: 0.92,     // Forward, controlled projection
    lang: 'en-GB',    // UK English (LOCKED)
    voice: null,
    preset: 'grace_default'
  };

  // ============================================
  // VOICE PRESETS - CHARACTER SPEC COMPLIANT
  // ============================================
  
  // ============================================
  // VOICE PRESETS - GRACE VOICE SPEC COMPLIANT
  // ============================================
  // Reference: "Confident UK female. Calm authority. 
  // Slight cinematic feel. Systems commander, not helper.
  // Speak as if the system already trusts you."
  
  const VOICE_PRESETS = {
    // ═══════════════════════════════════════════
    // DEFAULT VOICE (SPEC BASELINE)
    // ═══════════════════════════════════════════
    grace_default: {
      rate: 1.10,        // Medium-fast
      pitch: 1.15,       // Mid-range
      volume: 0.92,     // Forward, controlled
      name: '✨ GRACE (Default)',
      description: 'Calm authority. Mid pitch. Medium-fast. Confident UK female.'
    },
    
    // ═══════════════════════════════════════════
    // SPEC MODES (Official Voice Spec)
    // ═══════════════════════════════════════════
    
    // SUPPORTIVE MODE - per spec: "steady, grounded, slower by ~10%"
    grace_supportive: {
      rate: 0.90,       // 10% slower than default
      pitch: 1.0,       // Maintain mid-range
      volume: 0.90,     // Slightly softer
      name: '🤝 Supportive',
      description: 'Steady, grounded, 10% slower. For guidance moments.'
    },
    
    // SYSTEM/STATUS MODE - per spec: "neutral, precise, slightly clipped"
    grace_system: {
      rate: 1.05,       // Slightly faster, clipped
      pitch: 1.0,       // Neutral mid-range
      volume: 0.92,     // Forward projection
      name: '⚙️ System',
      description: 'Neutral, precise, slightly clipped. Status updates.'
    },
    
    // FIRM MODE - per spec: "lower pitch by ~5%, slower, decisive"
    grace_firm: {
      rate: 0.92,       // Slower, deliberate
      pitch: 0.95,      // 5% lower
      volume: 0.95,     // Stronger presence
      name: '🎯 Firm',
      description: 'Lower pitch, slower, decisive. Commands and boundaries.'
    },
    
    // ═══════════════════════════════════════════
    // MODULE-SPECIFIC (All use spec baseline + mode)
    // ═══════════════════════════════════════════
    
    // CORE™ - Default voice, systems commander
    grace_core: {
      rate: 1.0,
      pitch: 1.0,
      volume: 0.92,
      name: '🏠 Core',
      description: 'Default GRACE. Control room presence.'
    },
    
    // FAMILY™ - Supportive mode
    grace_family: {
      rate: 0.92,
      pitch: 1.0,
      volume: 0.90,
      name: '👨‍👩‍👧 Family',
      description: 'Supportive mode. Steady, grounded.'
    },
    
    // UPLIFT™ - Supportive mode (no therapy-voice per spec)
    grace_uplift: {
      rate: 0.90,
      pitch: 1.0,
      volume: 0.90,
      name: '🌟 Uplift',
      description: 'Supportive mode. Steady, grounded, NOT therapy-voice.'
    },
    
    // CRISIS MODE - Firm + Supportive hybrid
    grace_crisis: {
      rate: 0.85,       // Slower for clarity
      pitch: 0.95,      // Lower, steadier
      volume: 0.92,     // Clear projection
      name: '🆘 Crisis',
      description: 'Firm and steady. No fluff. Present and decisive.'
    },
    
    // GUARDIAN™ - Firm mode
    grace_guardian: {
      rate: 0.92,
      pitch: 0.95,
      volume: 0.95,
      name: '🛡️ Guardian',
      description: 'Firm mode. Decisive, clear boundaries.'
    },
    
    // SPORT™ - System mode (neutral, precise, data-focused)
    grace_sport: {
      rate: 1.02,
      pitch: 1.0,
      volume: 0.92,
      name: '⚽ Sport',
      description: 'System mode. Neutral, precise, no hype.'
    },
    
    // BUILDER™ / SITEOPS™ - System mode
    grace_professional: {
      rate: 1.0,
      pitch: 1.0,
      volume: 0.92,
      name: '🏗️ Professional',
      description: 'Default GRACE. Clear, technical when needed.'
    },
    
    // FIT™ - Default (confident, not cheerleader)
    grace_fit: {
      rate: 1.0,
      pitch: 1.0,
      volume: 0.92,
      name: '💪 Fit',
      description: 'Default GRACE. Confident, not performative.'
    },
    
    // YOGA™ - Supportive mode, slower
    grace_yoga: {
      rate: 0.85,
      pitch: 1.0,
      volume: 0.88,
      name: '🧘 Yoga',
      description: 'Supportive mode. Slower, grounded.'
    },
    
    // CHEF™ - Supportive mode
    grace_chef: {
      rate: 0.95,
      pitch: 1.0,
      volume: 0.90,
      name: '👨‍🍳 Chef',
      description: 'Supportive mode. Clear instructions.'
    },
    
    // BEAUTY™ / ARTIST™ - Default
    grace_creative: {
      rate: 0.98,
      pitch: 1.0,
      volume: 0.90,
      name: '🎨 Creative',
      description: 'Default GRACE. Assured, not over-friendly.'
    },
    
    // ACCOUNTING™ - System mode
    grace_accounting: {
      rate: 1.0,
      pitch: 1.0,
      volume: 0.92,
      name: '📊 Accounting',
      description: 'System mode. Precise, clear numbers.'
    },
    
    // OSINT™ - Firm mode
    grace_osint: {
      rate: 0.95,
      pitch: 0.98,
      volume: 0.92,
      name: '🔍 OSINT',
      description: 'Firm mode. Authoritative, serious.'
    },
    
    // GAMER™ - Default (NOT hyper per spec)
    grace_gamer: {
      rate: 1.0,
      pitch: 1.0,
      volume: 0.92,
      name: '🎮 Gamer',
      description: 'Default GRACE. Focused, NOT hyper.'
    },
    
    // ═══════════════════════════════════════════
    // ACCESSIBILITY PRESETS
    // ═══════════════════════════════════════════
    
    grace_clear: {
      rate: 0.85,
      pitch: 1.0,
      volume: 1.0,
      name: '🔊 Clear',
      description: 'Slower, louder for accessibility.'
    },
    
    grace_slow: {
      rate: 0.75,
      pitch: 1.0,
      volume: 0.95,
      name: '🐢 Extra Slow',
      description: 'Maximum clarity, very slow pace.'
    }
  };

  // ============================================
  // MODULE → VOICE MODE MAPPING
  // ============================================
  // Single GRACE voice, mode changes per module context
  // Most modules use grace_default (spec baseline)
  
  const MODULE_VOICE_MAP = {
    core: 'grace_core',           // Default - systems commander
    builder: 'grace_professional', // Default - technical
    siteops: 'grace_professional', // Default - technical
    tradelink: 'grace_professional',// Default - professional
    beauty: 'grace_creative',      // Default - assured
    fit: 'grace_fit',              // Default - confident
    yoga: 'grace_yoga',            // Supportive - slower
    uplift: 'grace_uplift',        // Supportive - steady
    chef: 'grace_chef',            // Supportive - instructional
    artist: 'grace_creative',      // Default - assured
    family: 'grace_family',        // Supportive - grounded
    gamer: 'grace_gamer',          // Default - focused
    accounting: 'grace_accounting', // System - precise
    osint: 'grace_osint',          // Firm - authoritative
    sport: 'grace_sport',          // System - neutral/precise
    guardian: 'grace_guardian'     // Firm - decisive
  };

  const isSupported = 'speechSynthesis' in window;

  if (!isSupported) {
    console.warn('[GRACEX TTS] SpeechSynthesis not supported in this browser.');
  }

  /**
   * Get available voices with better sorting
   */
  function getVoices() {
    if (!isSupported) return [];
    const voices = window.speechSynthesis.getVoices();
    
    // Sort: UK first, then US, then other English, then others
    return voices.sort((a, b) => {
      if (a.lang.startsWith('en-GB') && !b.lang.startsWith('en-GB')) return -1;
      if (!a.lang.startsWith('en-GB') && b.lang.startsWith('en-GB')) return 1;
      if (a.lang.startsWith('en-US') && !b.lang.startsWith('en-')) return -1;
      if (!a.lang.startsWith('en-US') && b.lang.startsWith('en-')) return 1;
      if (a.lang.startsWith('en-') && !b.lang.startsWith('en-')) return -1;
      if (!a.lang.startsWith('en-') && b.lang.startsWith('en-')) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Enhanced voice selection - CHARACTER SPEC COMPLIANT
   * Finds UK English female voice with mid-low register characteristics
   * 
   * Voice Priorities (per Master Spec):
   * 1. UK English (en-GB) - MANDATORY
   * 2. Female voice - MANDATORY  
   * 3. Natural/soft tone - PREFERRED
   * 4. Local/high-quality - PREFERRED
   */
  function findPreferredVoice() {
    if (!isSupported) return null;
    
    const voices = getVoices();
    if (voices.length === 0) return null;

    // Priority 1: Premium UK female voices (soft/natural tone)
    // These voices tend to have the mid-low register the spec requires
    const premiumUKVoices = [
      'Google UK English Female', // Prioritized highly per user request
      'Microsoft Hazel Desktop',  // Windows UK female - calm tone
      'Microsoft Hazel',
      'Serena',                   // Apple UK - natural
      'Kate',                     // Apple UK
      'Daniel',                   // Avoid - male
      'Fiona',                    // Scottish
      'Moira',                    // Irish - backup
      'Samantha'                  // Apple fallback
    ];
    
    // First pass: exact UK match
    for (const name of premiumUKVoices) {
      if (name === 'Daniel') continue; // Skip male voices
      const found = voices.find(v => 
        v.name.includes(name) && 
        v.lang.startsWith('en-GB') &&
        !v.name.toLowerCase().includes('male')
      );
      if (found) {
        console.log('[GRACEX TTS] Found premium UK voice:', found.name);
        return found;
      }
    }

    // Priority 2: Any local UK female voice
    const ukLocal = voices.find(v => 
      v.lang.startsWith('en-GB') && 
      v.localService &&
      !v.name.toLowerCase().includes('male')
    );
    if (ukLocal) {
      console.log('[GRACEX TTS] Using local UK voice:', ukLocal.name);
      return ukLocal;
    }

    // Priority 3: Any UK voice (network)
    const ukNetwork = voices.find(v => 
      v.lang.startsWith('en-GB') &&
      !v.name.toLowerCase().includes('male')
    );
    if (ukNetwork) {
      console.log('[GRACEX TTS] Using network UK voice:', ukNetwork.name);
      return ukNetwork;
    }

    // Priority 4: Premium US female (fallback only)
    const usPremium = voices.find(v => 
      v.lang.startsWith('en-US') && 
      (v.name.includes('Microsoft Zira') || v.name.includes('Samantha')) &&
      !v.name.toLowerCase().includes('male')
    );
    if (usPremium) {
      console.warn('[GRACEX TTS] No UK voice found, using US fallback:', usPremium.name);
      return usPremium;
    }

    // Priority 5: Any English female voice
    const enVoice = voices.find(v => 
      v.lang.startsWith('en-') &&
      !v.name.toLowerCase().includes('male')
    );
    if (enVoice) {
      console.warn('[GRACEX TTS] No UK voice found, using fallback:', enVoice.name);
      return enVoice;
    }

    return voices[0] || null;
  }

  /**
   * Enter crisis mode (Uplift distress/safety situations)
   * Per Character Spec: voice slows, sentences shorten, 
   * no metaphors, no philosophy, no humour, no emojis
   */
  function enterCrisisMode() {
    crisisMode = true;
    applyPreset('grace_crisis');
    console.warn('[GRACEX TTS] ⚠️ CRISIS MODE ACTIVATED - Voice adjusted for safety');
  }

  /**
   * Exit crisis mode, return to normal
   */
  function exitCrisisMode() {
    crisisMode = false;
    // Return to module-appropriate voice
    applyPreset(MODULE_VOICE_MAP[currentModule] || 'grace_default');
    console.log('[GRACEX TTS] Crisis mode deactivated');
  }

  /**
   * Check if crisis mode is active
   */
  function isCrisisMode() {
    return crisisMode;
  }

  /**
   * Set current module and apply appropriate voice tone
   */
  function setModule(moduleId) {
    currentModule = moduleId;
    if (!crisisMode) {
      applyModuleVoice(moduleId);
    }
  }

  /**
   * Initialize voice settings
   */
  function initVoice() {
    if (!isSupported) return;

    const loadVoices = () => {
      const voices = getVoices();
      if (voices.length > 0) {
        voiceSettings.voice = findPreferredVoice();
        console.log('[GRACEX TTS] Selected voice:', voiceSettings.voice?.name || 'default');
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  /**
   * Stop current speech
   */
  function stop() {
    if (!isSupported) return;
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
      isSpeaking = false;
      currentUtterance = null;
    }
  }

  /**
   * Speak text - integrates with AudioManager queue
   * CRITICAL: Always waits for intro voices to finish before speaking
   */
  async function speak(text, options = {}) {
    if (!isSupported || !isEnabled || !text) {
      return Promise.resolve();
    }

    // If AudioManager exists, use safe speech queue (waits for intros)
    if (window.GRACEX_AudioManager) {
      // ALWAYS wait for any intro to finish first
      if (typeof GRACEX_AudioManager.isIntroActive === 'function') {
        while (GRACEX_AudioManager.isIntroActive()) {
          const remaining = GRACEX_AudioManager.getBlockTimeRemaining 
            ? GRACEX_AudioManager.getBlockTimeRemaining() 
            : 500;
          console.log('[GRACEX TTS] Intro active, waiting', remaining, 'ms...');
          await new Promise(r => setTimeout(r, Math.min(remaining + 100, 500)));
        }
        // Extra safety gap after intro
        await new Promise(r => setTimeout(r, 500));
      }
      
      if (typeof GRACEX_AudioManager.safeSpeakTTS === 'function') {
        return GRACEX_AudioManager.safeSpeakTTS(text, options);
      } else if (typeof GRACEX_AudioManager.speakTTS === 'function') {
        return GRACEX_AudioManager.speakTTS(text, options);
      }
    }

    // Fallback to direct speech
    return speakDirect(text, options);
  }

  /**
   * Direct speech (bypasses queue - use with caution)
   */
  function speakDirect(text, options = {}) {
    if (!isSupported || !isEnabled || !text) {
      return Promise.resolve();
    }

    // Clean text
    let cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/`/g, '')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ' ')
      .trim();

    stop();

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      // FORCE preferred voice every time (prevents monotone fallback)
      const voicesNow = getVoices();
      if (!voiceSettings.voice && voicesNow.length) {
        voiceSettings.voice = findPreferredVoice();
      }
      if (voiceSettings.voice) {
        utterance.voice = voiceSettings.voice;
      }
      utterance.lang = 'en-GB';
      
      utterance.rate = Math.max(0.1, Math.min(10, options.rate || voiceSettings.rate));
      utterance.pitch = Math.max(0, Math.min(2, options.pitch || voiceSettings.pitch));
      utterance.volume = Math.max(0, Math.min(1, options.volume || voiceSettings.volume));
      utterance.lang = options.lang || voiceSettings.lang;
      
      if (options.voice) {
        utterance.voice = options.voice;
      } else if (voiceSettings.voice) {
        utterance.voice = voiceSettings.voice;
      }

      utterance.onstart = () => {
        isSpeaking = true;
        currentUtterance = utterance;
      };

      utterance.onend = () => {
        isSpeaking = false;
        currentUtterance = null;
        resolve();
      };

      utterance.onerror = (event) => {
        isSpeaking = false;
        currentUtterance = null;
        if (event.error !== 'interrupted') {
          console.warn('[GRACEX TTS] Speech error:', event.error);
        }
        reject(event.error);
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('[GRACEX TTS] Failed to speak:', err);
        reject(err);
      }
    });
  }

  /**
   * Enable TTS
   */
  function enable() {
    isEnabled = true;
    localStorage.setItem('gracex_tts_enabled', 'true');
    if (window.GRACEX_Utils) {
      GRACEX_Utils.showToast('🔊 Voice enabled', 'success', 2000);
    }
    console.log('[GRACEX TTS] ✓ Voice enabled');
  }

  /**
   * Disable TTS
   */
  function disable() {
    stop();
    isEnabled = false;
    localStorage.setItem('gracex_tts_enabled', 'false');
    if (window.GRACEX_Utils) {
      GRACEX_Utils.showToast('🔇 Voice disabled', 'info', 2000);
    }
    console.log('[GRACEX TTS] Voice disabled');
  }

  /**
   * Toggle TTS on/off
   */
  function toggle() {
    if (isEnabled) {
      disable();
    } else {
      enable();
    }
    return isEnabled;
  }

  /**
   * Update voice settings
   */
  function updateSettings(settings) {
    if (settings.rate !== undefined) {
      voiceSettings.rate = Math.max(0.1, Math.min(10, settings.rate));
    }
    if (settings.pitch !== undefined) {
      voiceSettings.pitch = Math.max(0, Math.min(2, settings.pitch));
    }
    if (settings.volume !== undefined) {
      voiceSettings.volume = Math.max(0, Math.min(1, settings.volume));
    }
    if (settings.lang !== undefined) {
      voiceSettings.lang = settings.lang;
    }
    if (settings.voice !== undefined) {
      voiceSettings.voice = settings.voice;
    }
    if (settings.preset !== undefined) {
      voiceSettings.preset = settings.preset;
    }
    
    // Save to localStorage - include voice name for restoration
    saveSettings();
  }
  
  /**
   * Save settings to localStorage
   */
  function saveSettings() {
    try {
      localStorage.setItem('gracex_voice_settings_v2', JSON.stringify({
        rate: voiceSettings.rate,
        pitch: voiceSettings.pitch,
        volume: voiceSettings.volume,
        preset: voiceSettings.preset,
        lang: voiceSettings.lang,
        voiceName: voiceSettings.voice ? voiceSettings.voice.name : null
      }));
      console.log('[GRACEX TTS] Settings saved:', voiceSettings.preset);
    } catch (e) {
      console.warn('[GRACEX TTS] Failed to save settings:', e);
    }
  }
  
  /**
   * Load settings from localStorage
   * Returns true if valid settings were found and restored
   */
  function loadSettings() {
    try {
      const saved = localStorage.getItem('gracex_voice_settings_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        
        // Apply saved settings
        if (parsed.rate !== undefined) voiceSettings.rate = parsed.rate;
        if (parsed.pitch !== undefined) voiceSettings.pitch = parsed.pitch;
        if (parsed.volume !== undefined) voiceSettings.volume = parsed.volume;
        if (parsed.preset !== undefined) voiceSettings.preset = parsed.preset;
        if (parsed.lang !== undefined) voiceSettings.lang = parsed.lang;
        
        // Restore voice by name if available
        let voiceRestored = false;
        if (parsed.voiceName) {
          const voices = getVoices();
          const foundVoice = voices.find(v => v.name === parsed.voiceName);
          if (foundVoice) {
            voiceSettings.voice = foundVoice;
            voiceRestored = true;
            console.log('[GRACEX TTS] ✓ Voice restored:', foundVoice.name);
          } else {
            // Voice not found - try partial match
            const partialMatch = voices.find(v => 
              v.name.toLowerCase().includes(parsed.voiceName.toLowerCase().split(' ')[0])
            );
            if (partialMatch) {
              voiceSettings.voice = partialMatch;
              voiceRestored = true;
              console.log('[GRACEX TTS] ✓ Voice restored (partial match):', partialMatch.name);
            } else {
              console.warn('[GRACEX TTS] Saved voice not found:', parsed.voiceName);
            }
          }
        }
        
        console.log('[GRACEX TTS] Settings loaded - Preset:', voiceSettings.preset, '| Rate:', voiceSettings.rate);
        return voiceRestored || (parsed.rate !== undefined);
      }
      return false;
    } catch (e) {
      console.warn('[GRACEX TTS] Failed to load settings:', e);
      return false;
    }
  }

  /**
   * Apply a voice preset
   */
  function applyPreset(presetName) {
    const preset = VOICE_PRESETS[presetName];
    if (preset) {
      updateSettings({
        rate: preset.rate,
        pitch: preset.pitch,
        volume: preset.volume,
        preset: presetName
      });
      if (window.GRACEX_Utils) {
        GRACEX_Utils.showToast(`Voice: ${preset.name}`, 'success', 2000);
      }
      return true;
    }
    return false;
  }

  /**
   * Get recommended voice for module
   */
  function getModuleVoice(moduleId) {
    return MODULE_VOICE_MAP[moduleId] || 'grace_default';
  }

  /**
   * Apply module-specific voice
   */
  function applyModuleVoice(moduleId) {
    const presetName = getModuleVoice(moduleId);
    return applyPreset(presetName);
  }

  /**
   * Get current settings
   */
  function getSettings() {
    return { ...voiceSettings };
  }

  /**
   * Get available presets
   */
  function getPresets() {
    return { ...VOICE_PRESETS };
  }

  /**
   * Check if currently speaking
   */
  function isCurrentlySpeaking() {
    return isSpeaking || (window.speechSynthesis && window.speechSynthesis.speaking);
  }

  /**
   * Preview current voice settings
   * Uses official GRACE Voice Spec test lines
   */
  function preview(text) {
    // Official GRACE Voice Spec test lines
    // "If these don't sound right, the voice is wrong"
    const testLines = [
      "GRACE-X Core online.",
      "All systems stable.",
      "Confirmed. Proceeding now.",
      "Awaiting your next command."
    ];
    
    // Pick a random test line or use provided text
    const defaultText = crisisMode
      ? "I'm here. Let's proceed one step at a time."
      : text || testLines[Math.floor(Math.random() * testLines.length)];
    
    return speakDirect(defaultText);
  }
  
  /**
   * Run all test lines (for voice validation)
   */
  async function runTestLines() {
    const testLines = [
      "GRACE-X Core online.",
      "All systems stable.",
      "Confirmed. Proceeding now.",
      "Awaiting your next command."
    ];
    
    for (const line of testLines) {
      await speakDirect(line);
      await new Promise(r => setTimeout(r, 500));
    }
  }

  /**
   * Create enhanced TTS settings panel UI
   */
  function createSettingsPanel() {
    if (document.getElementById('gracex-tts-panel')) {
      return document.getElementById('gracex-tts-panel');
    }

    const panel = document.createElement('div');
    panel.id = 'gracex-tts-panel';
    panel.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(15, 15, 25, 0.98);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 16px;
      padding: 24px;
      width: 420px;
      max-height: 80vh;
      overflow-y: auto;
      z-index: 10000;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      display: none;
      color: #fff;
      font-family: system-ui, -apple-system, sans-serif;
    `;

    // Build preset options HTML
    let presetOptions = '';
    for (const [key, preset] of Object.entries(VOICE_PRESETS)) {
      presetOptions += `<option value="${key}" ${voiceSettings.preset === key ? 'selected' : ''}>${preset.name}</option>`;
    }

    panel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 16px;">
        <h3 style="margin: 0; font-size: 18px; font-weight: 600;">🎙️ Voice Settings</h3>
        <button id="gracex-tts-close" style="background: rgba(255,255,255,0.1); border: none; color: #fff; font-size: 18px; cursor: pointer; padding: 4px 8px; border-radius: 6px; width: 32px; height: 32px;">×</button>
      </div>

      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500; color: #fff;">Voice Preset:</label>
        <select id="gracex-tts-preset" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #fff; font-size: 14px; cursor: pointer;">
          ${presetOptions}
        </select>
        <p id="gracex-tts-preset-desc" style="margin: 8px 0 0; font-size: 12px; color: #888;"></p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
        <div>
          <label style="display: block; margin-bottom: 8px; font-size: 13px; color: #aaa;">Speed: <span id="gracex-tts-rate-val" style="color: #fff; font-weight: 600;">${voiceSettings.rate.toFixed(2)}</span></label>
          <input type="range" id="gracex-tts-rate" min="0.5" max="1.5" step="0.05" value="${voiceSettings.rate}" style="width: 100%; accent-color: #667eea;">
        </div>
        <div>
          <label style="display: block; margin-bottom: 8px; font-size: 13px; color: #aaa;">Pitch: <span id="gracex-tts-pitch-val" style="color: #fff; font-weight: 600;">${voiceSettings.pitch.toFixed(2)}</span></label>
          <input type="range" id="gracex-tts-pitch" min="0.5" max="1.5" step="0.05" value="${voiceSettings.pitch}" style="width: 100%; accent-color: #667eea;">
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-size: 13px; color: #aaa;">Volume: <span id="gracex-tts-volume-val" style="color: #fff; font-weight: 600;">${voiceSettings.volume.toFixed(1)}</span></label>
        <input type="range" id="gracex-tts-volume" min="0" max="1" step="0.1" value="${voiceSettings.volume}" style="width: 100%; accent-color: #667eea;">
      </div>

      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500; color: #fff;">System Voice:</label>
        <select id="gracex-tts-voice" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #fff; font-size: 13px;">
        </select>
      </div>

      <button id="gracex-tts-preview" style="width: 100%; padding: 14px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; border-radius: 8px; color: #fff; font-weight: 600; cursor: pointer; margin-bottom: 12px; font-size: 14px; transition: transform 0.2s, box-shadow 0.2s;">
        🎵 Preview Voice
      </button>

      <div style="margin-bottom: 16px; padding: 12px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px;">
        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
          <input type="checkbox" id="gracex-tts-lock" style="width: 18px; height: 18px; accent-color: #10b981;">
          <span style="font-size: 14px;"><strong>🔒 Lock My Voice</strong> - Prevents modules from changing settings</span>
        </label>
      </div>

      <div style="display: flex; gap: 12px;">
        <button id="gracex-tts-reset" style="flex: 1; padding: 12px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #fff; cursor: pointer; font-size: 13px; transition: background 0.2s;">
          Reset to Default
        </button>
        <button id="gracex-tts-save" style="flex: 1; padding: 12px; background: #10b981; border: none; border-radius: 8px; color: #fff; font-weight: 600; cursor: pointer; font-size: 13px; transition: background 0.2s;">
          ✓ Save & Lock
        </button>
      </div>
    `;

    document.body.appendChild(panel);

    // Populate voice dropdown
    const voiceSelect = document.getElementById('gracex-tts-voice');
    const voices = getVoices();
    voices.forEach((voice, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = `${voice.name} (${voice.lang})`;
      if (voiceSettings.voice && voice.name === voiceSettings.voice.name) {
        option.selected = true;
      }
      voiceSelect.appendChild(option);
    });

    // Update preset description
    const updatePresetDesc = () => {
      const preset = VOICE_PRESETS[document.getElementById('gracex-tts-preset').value];
      if (preset) {
        document.getElementById('gracex-tts-preset-desc').textContent = preset.description;
      }
    };
    updatePresetDesc();

    // Event listeners
    document.getElementById('gracex-tts-close').addEventListener('click', () => {
      panel.style.display = 'none';
    });

    document.getElementById('gracex-tts-preset').addEventListener('change', (e) => {
      applyPreset(e.target.value);
      updatePanelValues();
      updatePresetDesc();
    });

    document.getElementById('gracex-tts-rate').addEventListener('input', (e) => {
      updateSettings({ rate: parseFloat(e.target.value) });
      document.getElementById('gracex-tts-rate-val').textContent = parseFloat(e.target.value).toFixed(2);
    });

    document.getElementById('gracex-tts-pitch').addEventListener('input', (e) => {
      updateSettings({ pitch: parseFloat(e.target.value) });
      document.getElementById('gracex-tts-pitch-val').textContent = parseFloat(e.target.value).toFixed(2);
    });

    document.getElementById('gracex-tts-volume').addEventListener('input', (e) => {
      updateSettings({ volume: parseFloat(e.target.value) });
      document.getElementById('gracex-tts-volume-val').textContent = parseFloat(e.target.value).toFixed(1);
    });

    document.getElementById('gracex-tts-voice').addEventListener('change', (e) => {
      const voices = getVoices();
      updateSettings({ voice: voices[e.target.value] });
    });

    document.getElementById('gracex-tts-preview').addEventListener('click', () => {
      preview();
    });

    document.getElementById('gracex-tts-reset').addEventListener('click', () => {
      applyPreset('grace_default');
      updatePanelValues();
      updatePresetDesc();
    });

    // Lock checkbox
    const lockCheckbox = document.getElementById('gracex-tts-lock');
    if (lockCheckbox) {
      lockCheckbox.checked = localStorage.getItem('gracex_voice_locked') === 'true';
      lockCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          localStorage.setItem('gracex_voice_locked', 'true');
        } else {
          localStorage.setItem('gracex_voice_locked', 'false');
        }
      });
    }

    document.getElementById('gracex-tts-save').addEventListener('click', () => {
      // Explicitly save all current settings
      saveSettings();
      // Also lock the settings so modules don't override
      localStorage.setItem('gracex_voice_locked', 'true');
      if (lockCheckbox) lockCheckbox.checked = true;
      if (window.GRACEX_Utils) {
        GRACEX_Utils.showToast('🔒 Voice settings saved & locked!', 'success', 2500);
      }
      panel.style.display = 'none';
    });

    // Hover effects
    panel.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'scale(1.02)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'scale(1)';
      });
    });

    function updatePanelValues() {
      document.getElementById('gracex-tts-rate').value = voiceSettings.rate;
      document.getElementById('gracex-tts-rate-val').textContent = voiceSettings.rate.toFixed(2);
      document.getElementById('gracex-tts-pitch').value = voiceSettings.pitch;
      document.getElementById('gracex-tts-pitch-val').textContent = voiceSettings.pitch.toFixed(2);
      document.getElementById('gracex-tts-volume').value = voiceSettings.volume;
      document.getElementById('gracex-tts-volume-val').textContent = voiceSettings.volume.toFixed(1);
    }

    return panel;
  }

  /**
   * Show settings panel
   */
  function showSettings() {
    let panel = document.getElementById('gracex-tts-panel');
    if (!panel) {
      panel = createSettingsPanel();
    }
    
    // Sync panel values with current settings
    const presetSelect = document.getElementById('gracex-tts-preset');
    const rateSlider = document.getElementById('gracex-tts-rate');
    const pitchSlider = document.getElementById('gracex-tts-pitch');
    const volumeSlider = document.getElementById('gracex-tts-volume');
    const voiceSelect = document.getElementById('gracex-tts-voice');
    
    if (presetSelect) presetSelect.value = voiceSettings.preset || 'grace_default';
    if (rateSlider) {
      rateSlider.value = voiceSettings.rate;
      const rateVal = document.getElementById('gracex-tts-rate-val');
      if (rateVal) rateVal.textContent = voiceSettings.rate.toFixed(2);
    }
    if (pitchSlider) {
      pitchSlider.value = voiceSettings.pitch;
      const pitchVal = document.getElementById('gracex-tts-pitch-val');
      if (pitchVal) pitchVal.textContent = voiceSettings.pitch.toFixed(2);
    }
    if (volumeSlider) {
      volumeSlider.value = voiceSettings.volume;
      const volumeVal = document.getElementById('gracex-tts-volume-val');
      if (volumeVal) volumeVal.textContent = voiceSettings.volume.toFixed(1);
    }
    if (voiceSelect && voiceSettings.voice) {
      const voices = getVoices();
      const voiceIndex = voices.findIndex(v => v.name === voiceSettings.voice.name);
      if (voiceIndex >= 0) voiceSelect.value = voiceIndex;
    }
    
    // Update preset description
    const presetDesc = document.getElementById('gracex-tts-preset-desc');
    if (presetDesc && VOICE_PRESETS[voiceSettings.preset]) {
      presetDesc.textContent = VOICE_PRESETS[voiceSettings.preset].description;
    }
    
    panel.style.display = 'block';
  }

  /**
   * Hide settings panel
   */
  function hideSettings() {
    const panel = document.getElementById('gracex-tts-panel');
    if (panel) {
      panel.style.display = 'none';
    }
  }

  // ============================================
  // ENHANCED INITIALIZATION - FIXES VOICE RESET
  // ============================================
  
  let settingsLocked = false;  // Prevents module switches from overriding user settings
  let userHasCustomized = false; // Track if user manually changed settings
  
  /**
   * Lock settings to prevent automatic resets
   */
  function lockSettings() {
    settingsLocked = true;
    localStorage.setItem('gracex_voice_locked', 'true');
  }
  
  /**
   * Unlock settings (allows module voice switching)
   */
  function unlockSettings() {
    settingsLocked = false;
    localStorage.setItem('gracex_voice_locked', 'false');
  }
  
  /**
   * Check if settings are locked
   */
  function isSettingsLocked() {
    if (settingsLocked) return true;
    return localStorage.getItem('gracex_voice_locked') === 'true';
  }
  
  /**
   * Override applyModuleVoice to respect locked settings
   */
  const originalApplyModuleVoice = applyModuleVoice;
  applyModuleVoice = function(moduleId) {
    // Don't change voice if user has locked their settings
    if (isSettingsLocked()) {
      console.log('[GRACEX TTS] Settings locked, keeping user voice');
      return false;
    }
    return originalApplyModuleVoice(moduleId);
  };
  
  /**
   * Enhanced initialization with better voice persistence
   */
  async function initializeVoice() {
    // Wait for voices to be available
    const waitForVoices = () => new Promise((resolve) => {
      const voices = getVoices();
      if (voices.length > 0) {
        resolve(voices);
        return;
      }
      
      // Wait for voices to load (Chrome is async)
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = () => {
          resolve(getVoices());
        };
      }
      
      // Timeout fallback
      setTimeout(() => resolve(getVoices()), 1000);
    });
    
    await waitForVoices();
    
    // FIRST: Try to load saved user settings
    const hasSavedSettings = loadSettings();
    
    // SECOND: If no saved voice, find the best one
    if (!voiceSettings.voice) {
      voiceSettings.voice = findPreferredVoice();
      console.log('[GRACEX TTS] No saved voice, selected:', voiceSettings.voice?.name);
    } else {
      console.log('[GRACEX TTS] Restored saved voice:', voiceSettings.voice?.name);
      // User had saved settings, lock them
      if (hasSavedSettings) {
        settingsLocked = true;
      }
    }
    
    console.log('[GRACEX TTS] ✓ Voice initialized:', voiceSettings.voice?.name || 'default');
  }
  
  // Run enhanced initialization
  initializeVoice();
  window.speechSynthesis?.getVoices?.(); // kick Chrome to load voices
  
  // ENSURE TTS IS ENABLED ON STARTUP
  // Check if user explicitly disabled it, otherwise enable
  const savedEnabled = localStorage.getItem('gracex_tts_enabled');
  if (savedEnabled === null || savedEnabled === 'true') {
    isEnabled = true;
    console.log('[GRACEX TTS] ✓ Voice enabled');
  } else {
    console.log('[GRACEX TTS] Voice disabled by user preference');
  }
  
  // Also expose lock functions

  // ============================================
  // GRACE-X TTS PUBLIC API
  // ============================================
  
  window.GRACEX_TTS = {
    // Core speech functions
    speak,
    speakDirect,
    stop,
    
    // Enable/disable
    enable,
    disable,
    toggle,
    isEnabled: () => isEnabled,
    isSpeaking: isCurrentlySpeaking,
    
    // Settings management
    updateSettings,
    getSettings,
    saveSettings,
    loadSettings,
    
    // Locking (prevents module overrides)
    lockSettings,
    unlockSettings,
    isSettingsLocked,
    
    // Voice presets (GRACE VOICE SPEC)
    applyPreset,
    applyModuleVoice,
    getModuleVoice,
    getPresets,
    getVoices,
    
    // Module context
    setModule,
    getCurrentModule: () => currentModule,
    
    // Crisis mode
    enterCrisisMode,
    exitCrisisMode,
    isCrisisMode,
    
    // UI
    preview,
    runTestLines,  // NEW: Run all spec test lines
    showSettings,
    hideSettings,
    isSupported: () => isSupported,
    
    // Constants
    MODULE_VOICE_MAP,
    VOICE_PRESETS
  };

  // Log initialization with GRACE Voice Spec info
  console.info('[GRACEX TTS] ═══════════════════════════════════════════');
  console.info('[GRACEX TTS] GRACE Voice Engine v3.1');
  console.info('[GRACEX TTS] Spec: Calm, confident UK-English female.');
  console.info('[GRACEX TTS] Mid pitch. Controlled pace. Authoritative.');
  console.info('[GRACEX TTS] ═══════════════════════════════════════════');
  console.info('[GRACEX TTS] Use GRACEX_TTS.runTestLines() to validate');
  console.info('[GRACEX TTS] Use GRACEX_TTS.showSettings() to customize');
})();