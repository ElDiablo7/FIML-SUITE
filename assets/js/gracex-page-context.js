// GRACE-X Page Context — read placeholders and field values for the brain
// Every module can "Use page context" so the brain sees and can calculate from current page data.
(function() {
  'use strict';

  /**
   * Gather all inputs, textareas, selects in container (placeholders + current values).
   * Returns a string the brain can use to "see" and calculate from the page.
   * @param {HTMLElement} [container] - Root to scan (default: #view or document.body)
   * @returns {string}
   */
  window.GRACEX_getPageContext = function(container) {
    const root = container || document.getElementById('view') || document.body;
    if (!root) return '';

    const items = [];
    const seen = new Set();

    function labelFor(el) {
      if (el.id && !seen.has(el.id)) {
        const label = root.querySelector('label[for="' + el.id + '"]');
        if (label) return label.textContent.trim().replace(/\s+/g, ' ');
      }
      if (el.getAttribute('aria-label')) return el.getAttribute('aria-label').trim();
      if (el.name) return el.name;
      if (el.placeholder) return el.placeholder;
      return el.id || el.className || 'Field';
    }

    function add(name, value, placeholder) {
      const display = value != null && String(value).trim() !== '' ? String(value).trim() : '(empty)';
      const place = placeholder ? ' (placeholder: ' + placeholder + ')' : '';
      items.push('- ' + name + place + ': ' + display);
    }

    const inputs = root.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([id*="brain-"])');
    inputs.forEach(function(el) {
      const name = labelFor(el);
      const placeholder = el.placeholder ? el.placeholder.trim() : '';
      const value = el.value;
      add(name, value, placeholder && value === '' ? placeholder : '');
    });

    const textareas = root.querySelectorAll('textarea:not([id*="brain-"])');
    textareas.forEach(function(el) {
      const name = labelFor(el);
      const placeholder = el.placeholder ? el.placeholder.trim() : '';
      const value = el.value;
      add(name, value, placeholder && value === '' ? placeholder : '');
    });

    const selects = root.querySelectorAll('select:not([id*="brain-"])');
    selects.forEach(function(el) {
      const name = labelFor(el);
      const selected = el.options[el.selectedIndex];
      const value = selected ? selected.text : '';
      add(name, value, '');
    });

    if (items.length === 0) return 'No form fields or placeholders found on this page.';
    return 'Page data (placeholders and current values):\n' + items.join('\n');
  };

  function wireAllSuggestionButtons() {
    const view = document.getElementById('view');
    const root = view || document.body;
    root.querySelectorAll('.brain-suggest-btn').forEach(function(btn) {
      if (btn.dataset.wired) return;
      btn.dataset.wired = "true";

      const panel = btn.closest('.module-brain');
      const input = panel ? panel.querySelector('input[id*="-brain-input"]') : null;
      const sendBtn = panel ? panel.querySelector('button[id*="-brain-send"]') : null;

      if (!input) return;

      btn.onclick = function() {
        const prompt = btn.dataset.prompt || btn.textContent.trim();
        input.value = prompt;
        input.focus();
        
        // Optional: auto-send if desired. Comment out if user should press enter.
        // if (sendBtn) sendBtn.click();
      };
    });
  }

  document.addEventListener('gracex:module:loaded', function() {
    setTimeout(wireAllSuggestionButtons, 100);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireAllSuggestionButtons);
  } else {
    wireAllSuggestionButtons();
  }

  console.log('[GRACEX] Prompt suggestion buttons wired up.');
})();
