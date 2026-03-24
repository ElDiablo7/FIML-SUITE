/* ============================================
   GRACE-X BOOT SCREEN CONTROLLER
   Enterprise Startup Sequence
   ============================================ */

(function(window) {
  'use strict';

  const GraceXBoot = {
    initialized: false,
    startTime: Date.now(),
    modules: [
      'CORE BRAIN SYSTEM',
      'STATE MANAGER',
      'ROUTER',
      'RAM CACHE',
      'ANALYTICS ENGINE',
      'MASTER BRAIN',
      'MASTER CONTROL',
      'CALL SHEETS',
      'RISK & SAFETY',
      'BUILDER MODULE',
      'SPORT MODULE',
      'GUARDIAN MODULE',
      'OSINT MODULE',
      'ACCOUNTING MODULE',
      'FORGE MODULE',
      'LASER™ ULTRA',
      'NETWORK MANAGER',
      'UI CONTROLS'
    ],
    currentModuleIndex: 0,
    bootDuration: 17000, // ~17s — two boot clips with crossfade
    skipRequested: false,
    currentVideo: 1,
    crossfadedFrom: {}, // guard: prevent double crossfade per video

    init() {
      if (this.initialized) return;
      this.initialized = true;

      // Check if user wants to skip boot (localStorage preference)
      const skipBoot = localStorage.getItem('gracex_skip_boot') === 'true';
      if (skipBoot) {
        this.skipBoot();
        return;
      }

      console.log('🚀 GRACE-X BOOT SEQUENCE INITIATED');
      
      this.createBootScreen();
      this.startBootSequence();
      this.setupEventListeners();
    },

    createBootScreen() {
      const bootScreen = document.createElement('div');
      bootScreen.id = 'gracex-boot-screen';
      bootScreen.innerHTML = `
        <!-- Full-screen boot video - WITH SOUND -->
        <div class="boot-video-layer" id="boot-video-layer">
          <video id="boot-video-1" class="boot-video boot-video-active" src="assets/video/boot_3.mp4" playsinline preload="auto" muted></video>
        </div>
        
        <!-- Skip Hint (minimal, bottom corner) -->
        <div class="boot-skip-hint">
          Press any key to skip
        </div>
      `;
      
      document.body.insertBefore(bootScreen, document.body.firstChild);
      
      // Auto start video without waiting for a click
      this.startBootVideo();
    },

    startBootVideo() {
      const video1 = document.getElementById('boot-video-1');
      if (!video1) return;

      const self = this;

      function fallbackNoVideo() {
        console.warn('[BOOT] Video failed, completing boot after 6s');
        setTimeout(() => self.completeBoot(), 6000);
      }

      video1.addEventListener('error', fallbackNoVideo);
      
      video1.addEventListener('ended', () => {
        self.completeBoot();
      });

      // Track if we've started playing
      let playStarted = false;

      function tryPlay() {
        if (playStarted) return;
        console.log('[BOOT] Attempting to play video 1, readyState:', video1.readyState);
        video1.play().then(() => {
          playStarted = true;
        }).catch((err) => {
          console.warn('[BOOT] Play failed:', err.message);
          // If autoplay fails, we just complete boot so the user isn't stuck
          self.completeBoot();
        });
      }

      // Force load before playing to prevent interrupting the play() request
      video1.load();

      // We don't tryPlay on loadeddata automatically because we are already running inside a click handler
      // We no longer have a click handler, but we still try to play immediately
      tryPlay();

      // Aggressive fallback: if nothing happens after 8s, complete boot
      setTimeout(() => {
        if (!playStarted && video1.paused) {
          console.warn('[BOOT] Video failed to start after 8s, completing boot');
          self.completeBoot();
        }
      }, 8000);
    },

    startBootSequence() {
      // Video-only boot - no overlay elements to update
      // Boot completion is handled by video end event in startBootVideo()
      console.log('🎬 Boot video playing with sound...');
    },

    completeBoot() {
      const video1 = document.getElementById('boot-video-1');
      if (video1) video1.pause();
      
      // Fade out immediately
      this.fadeOutBoot();
    },

    fadeOutBoot() {
      const bootScreen = document.getElementById('gracex-boot-screen');
      const app = document.getElementById('app');
      
      bootScreen.classList.add('fade-out');
      
      setTimeout(() => {
        bootScreen.classList.add('hidden');
        
        // Show main app with fade-in
        if (app) {
          app.style.display = 'flex';
          // Trigger fade-in animation
          setTimeout(() => {
            app.classList.add('app-ready');
          }, 50); // Small delay to ensure transition triggers
        }
        
        console.log('✅ GRACE-X BOOT COMPLETE - System Ready');
        
        // Dispatch custom event for other systems to know boot is complete
        window.dispatchEvent(new CustomEvent('gracex:boot-complete'));
      }, 1000);
    },

    skipBoot() {
      const bootScreen = document.getElementById('gracex-boot-screen');
      const app = document.getElementById('app');
      
      if (bootScreen) {
        bootScreen.classList.add('hidden');
      }
      
      // Show app immediately when skipping
      if (app) {
        app.style.display = 'flex';
        app.classList.add('app-ready');
      }
      
      console.log('⏭️ GRACE-X BOOT SKIPPED');
      window.dispatchEvent(new CustomEvent('gracex:boot-complete'));
    },

    setupEventListeners() {
      // Press any key to skip
      const skipHandler = (e) => {
        if (this.skipRequested) return;
        
        this.skipRequested = true;
        
        // ESC = skip always
        if (e.key === 'Escape') {
          localStorage.setItem('gracex_skip_boot', 'true');
          console.log('🔇 Boot screen disabled for future sessions');
        }
        
        this.completeBoot();
        document.removeEventListener('keydown', skipHandler);
      };
      
      document.addEventListener('keydown', skipHandler);
      
      // Click to skip
      const bootScreen = document.getElementById('gracex-boot-screen');
      bootScreen.addEventListener('click', () => {
        if (!this.skipRequested) {
          this.skipRequested = true;
          this.completeBoot();
        }
      });
    },

    getBuildVersion() {
      // Try to extract version from script tags
      const scripts = document.querySelectorAll('script[src*="?v="]');
      if (scripts.length > 0) {
        const src = scripts[0].src;
        const match = src.match(/\?v=([^&]+)/);
        return match ? match[1] : 'TITAN';
      }
      return 'TITAN';
    },

    // Public method to re-enable boot screen
    enableBootScreen() {
      localStorage.removeItem('gracex_skip_boot');
      console.log('✅ Boot screen re-enabled');
    }
  };

  // Export to window
  window.GraceXBoot = GraceXBoot;

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      GraceXBoot.init();
    });
  } else {
    GraceXBoot.init();
  }

})(window);
