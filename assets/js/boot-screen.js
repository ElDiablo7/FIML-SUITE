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
        <!-- Full-screen boot video (three clips, crossfade) - WITH SOUND -->
        <div class="boot-video-layer" id="boot-video-layer">
          <video id="boot-video-1" class="boot-video boot-video-active" src="assets/video/boot-1.mp4" playsinline preload="auto" muted></video>
          <video id="boot-video-2" class="boot-video" src="assets/video/boot-2.mp4" playsinline preload="auto" muted></video>
          <video id="boot-video-3" class="boot-video" src="assets/video/boot-3.mp4" playsinline preload="auto" muted></video>
        </div>
        
        <!-- Skip Hint (minimal, bottom corner) -->
        <div class="boot-skip-hint">
          Press any key to skip
        </div>

        <!-- Autoplay Policy Override Overlay -->
        <div id="boot-start-overlay" style="position: absolute; top:0; left:0; width:100%; height:100%; z-index: 1000; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.8); cursor: pointer;">
          <button id="boot-start-btn" style="padding: 15px 30px; font-size: 20px; background: rgba(0, 212, 255, 0.2); border: 1px solid #00d4ff; color: #00d4ff; border-radius: 4px; box-shadow: 0 0 15px rgba(0, 212, 255, 0.4); pointer-events: none;">START GRACE-X</button>
        </div>
      `;
      
      document.body.insertBefore(bootScreen, document.body.firstChild);
      
      // Wait for user interaction to start the video
      const overlay = document.getElementById('boot-start-overlay');
      overlay.addEventListener('click', () => {
        overlay.style.display = 'none';
        this.startBootVideo();
      });
    },

    startBootVideo() {
      const video1 = document.getElementById('boot-video-1');
      const video2 = document.getElementById('boot-video-2');
      const video3 = document.getElementById('boot-video-3');
      if (!video1 || !video2 || !video3) return;

      const self = this;
      const videos = [video1, video2, video3];

      function fallbackNoVideo() {
        console.warn('[BOOT] Video failed, completing boot after 6s');
        setTimeout(() => self.completeBoot(), 6000);
      }

      function crossfadeToNext(currentIdx) {
        if (self.crossfadedFrom[currentIdx]) return;
        self.crossfadedFrom[currentIdx] = true;

        const current = videos[currentIdx - 1];
        const next = videos[currentIdx];
        
        if (!next) {
          self.completeBoot();
          return;
        }

        console.log(`🎬 Crossfade: video ${currentIdx} → video ${currentIdx + 1}`);
        current.classList.remove('boot-video-active');
        next.classList.add('boot-video-active');
        next.muted = false;
        next.play().catch(() => fallbackNoVideo());
        self.currentVideo = currentIdx + 1;
      }

      // Set up event listeners for each video
      videos.forEach((video, idx) => {
        const videoNum = idx + 1;
        
        video.addEventListener('error', fallbackNoVideo);
        
        video.addEventListener('ended', () => {
          if (videoNum === 3) {
            // Last video ended, complete boot
            self.completeBoot();
          } else {
            // Crossfade to next video
            crossfadeToNext(videoNum);
          }
        });

        // Start crossfade slightly before video ends (smoother transition)
        video.addEventListener('timeupdate', () => {
          const d = video.duration;
          if (self.currentVideo === videoNum && videoNum < 3 && isFinite(d) && d > 0) {
            if (video.currentTime >= Math.max(0, d - 0.5)) {
              crossfadeToNext(videoNum);
            }
          }
        });
      });

      // Track if we've started playing
      let playStarted = false;

      function tryPlay() {
        if (playStarted) return;
        console.log('[BOOT] Attempting to play video 1, readyState:', video1.readyState);
        video1.play().then(() => {
          playStarted = true;
          console.log('[BOOT] Video 1 playing!');
          video1.muted = false; // We can unmute immediately now because of the prior user click
        }).catch((err) => {
          console.warn('[BOOT] Play failed:', err.message);
          // Don't fallback immediately - might just need user interaction
        });
      }

      // We don't tryPlay on loadeddata automatically because we are already running inside a click handler
      tryPlay();

      // Force load
      video1.load();

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
      const video2 = document.getElementById('boot-video-2');
      const video3 = document.getElementById('boot-video-3');
      if (video1) video1.pause();
      if (video2) video2.pause();
      if (video3) video3.pause();
      
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
