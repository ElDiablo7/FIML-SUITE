/**
 * ═══════════════════════════════════════════════════════════════════════
 * GRACE-X ANALYTICS BRAIN™
 * ═══════════════════════════════════════════════════════════════════════
 * Purpose: Deep inspection, pattern recognition, synthesis engine
 * Owner: Zac Crockett
 * Version: 1.0.0
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * WHAT ANALYTICS BRAIN DOES:
 * - Deep element/object inspection
 * - Pattern recognition across data
 * - Structural analysis
 * - Anomaly detection
 * - Data synthesis and correlation
 * - Metadata extraction
 * 
 * WHAT ANALYTICS BRAIN IS NOT:
 * - A chat interface (no personality)
 * - A decision maker (provides insights, not actions)
 * - For real-time streaming (batch analysis focused)
 * - A database (analysis only)
 * 
 * ═══════════════════════════════════════════════════════════════════════
 */

(function () {
  window.GraceX = window.GraceX || {};
  window.GraceX.Analytics = {};

  // ═══════════════════════════════════════════════════════════════════════
  // ANALYTICS CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════
  
  const ANALYTICS_CONFIG = {
    maxDepth: 5,              // Maximum object inspection depth
    maxArrayItems: 100,       // Max array items to analyze
    enablePatterns: true,     // Pattern recognition
    enableAnomalies: true,    // Anomaly detection
    enableMetrics: true,      // Statistical metrics
    cacheResults: true,       // Cache analysis results
    cacheTTL: 5 * 60 * 1000  // Cache time-to-live (5 mins)
  };

  // Analysis cache
  const ANALYSIS_CACHE = new Map();

  // ═══════════════════════════════════════════════════════════════════════
  // CORE INSPECTION ENGINE
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Deep inspect any object/element/data structure
   * @param {any} target - Target to inspect
   * @param {object} options - Analysis options
   * @returns {object} Comprehensive analysis report
   */
  GraceX.Analytics.inspect = function(target, options = {}) {
    const startTime = performance.now();
    const opts = { ...ANALYTICS_CONFIG, ...options };
    
    try {
      let analysis = {
        timestamp: Date.now(),
        type: getTargetType(target),
        summary: {},
        structure: {},
        metadata: {},
        patterns: [],
        anomalies: [],
        metrics: {},
        insights: []
      };

      // Type-specific analysis
      switch (analysis.type) {
        case 'dom-element':
          analysis = inspectDOMElement(target, opts);
          break;
        case 'array':
          analysis = inspectArray(target, opts);
          break;
        case 'object':
          analysis = inspectObject(target, opts);
          break;
        case 'string':
          analysis = inspectString(target, opts);
          break;
        case 'number':
          analysis = inspectNumber(target, opts);
          break;
        case 'function':
          analysis = inspectFunction(target, opts);
          break;
        default:
          analysis.summary = { primitive: true, value: target };
      }

      // Add processing time
      analysis.processingTime = performance.now() - startTime;
      
      // Cache if enabled
      if (opts.cacheResults) {
        const cacheKey = generateCacheKey(target);
        ANALYSIS_CACHE.set(cacheKey, {
          analysis,
          timestamp: Date.now(),
          ttl: opts.cacheTTL
        });
      }

      return analysis;
      
    } catch (e) {
      console.error("[ANALYTICS] Inspection error:", e);
      return {
        error: true,
        message: e.message,
        type: 'unknown',
        processingTime: performance.now() - startTime
      };
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // TYPE-SPECIFIC INSPECTORS
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Inspect DOM Element
   */
  function inspectDOMElement(el, opts) {
    const analysis = {
      type: 'dom-element',
      summary: {
        tag: el.tagName?.toLowerCase(),
        id: el.id || null,
        classes: Array.from(el.classList || []),
        attributes: getAttributes(el)
      },
      structure: {
        parent: el.parentElement?.tagName?.toLowerCase() || null,
        children: el.children?.length || 0,
        siblings: getSiblingCount(el),
        depth: getElementDepth(el)
      },
      metadata: {
        dimensions: el.getBoundingClientRect ? {
          width: el.getBoundingClientRect().width,
          height: el.getBoundingClientRect().height,
          top: el.getBoundingClientRect().top,
          left: el.getBoundingClientRect().left
        } : null,
        visibility: {
          visible: isElementVisible(el),
          inViewport: isInViewport(el)
        },
        computed: getComputedStyleSummary(el)
      },
      patterns: [],
      insights: []
    };

    // Pattern detection
    if (opts.enablePatterns) {
      analysis.patterns = detectDOMPatterns(el);
    }

    // Generate insights
    analysis.insights = generateDOMInsights(analysis);

    return analysis;
  }

  /**
   * Inspect Array
   */
  function inspectArray(arr, opts) {
    const sample = arr.slice(0, opts.maxArrayItems);
    
    const analysis = {
      type: 'array',
      summary: {
        length: arr.length,
        sampled: sample.length,
        isEmpty: arr.length === 0
      },
      structure: {
        types: getArrayTypes(sample),
        homogeneous: isHomogeneous(sample),
        nested: hasNestedStructures(sample),
        maxDepth: getMaxDepth(sample, 0, opts.maxDepth)
      },
      metadata: {},
      patterns: [],
      metrics: {},
      insights: []
    };

    // Numeric analysis if array contains numbers
    if (analysis.structure.types.includes('number')) {
      analysis.metrics = calculateNumericMetrics(sample.filter(x => typeof x === 'number'));
    }

    // Pattern detection
    if (opts.enablePatterns) {
      analysis.patterns = detectArrayPatterns(sample);
    }

    // Anomaly detection
    if (opts.enableAnomalies && analysis.structure.homogeneous) {
      analysis.anomalies = detectArrayAnomalies(sample);
    }

    // Generate insights
    analysis.insights = generateArrayInsights(analysis);

    return analysis;
  }

  /**
   * Inspect Object
   */
  function inspectObject(obj, opts) {
    const keys = Object.keys(obj);
    const values = Object.values(obj);
    
    const analysis = {
      type: 'object',
      summary: {
        keys: keys.length,
        isEmpty: keys.length === 0,
        keyList: keys.slice(0, 20) // First 20 keys
      },
      structure: {
        depth: calculateObjectDepth(obj, 0, opts.maxDepth),
        types: getObjectValueTypes(values),
        nested: values.some(v => typeof v === 'object' && v !== null),
        circular: hasCircularReference(obj)
      },
      metadata: {
        prototype: Object.getPrototypeOf(obj)?.constructor?.name || 'Object',
        frozen: Object.isFrozen(obj),
        sealed: Object.isSealed(obj),
        extensible: Object.isExtensible(obj)
      },
      patterns: [],
      insights: []
    };

    // Pattern detection
    if (opts.enablePatterns) {
      analysis.patterns = detectObjectPatterns(obj, keys);
    }

    // Generate insights
    analysis.insights = generateObjectInsights(analysis);

    return analysis;
  }

  /**
   * Inspect String
   */
  function inspectString(str, opts) {
    const analysis = {
      type: 'string',
      summary: {
        length: str.length,
        isEmpty: str.length === 0,
        preview: str.slice(0, 100)
      },
      structure: {
        lines: str.split('\n').length,
        words: str.split(/\s+/).filter(w => w.length > 0).length,
        chars: {
          alphanumeric: (str.match(/[a-zA-Z0-9]/g) || []).length,
          whitespace: (str.match(/\s/g) || []).length,
          special: (str.match(/[^a-zA-Z0-9\s]/g) || []).length
        }
      },
      patterns: [],
      insights: []
    };

    // Pattern detection
    if (opts.enablePatterns) {
      analysis.patterns = detectStringPatterns(str);
    }

    // Generate insights
    analysis.insights = generateStringInsights(analysis);

    return analysis;
  }

  /**
   * Inspect Number
   */
  function inspectNumber(num, opts) {
    return {
      type: 'number',
      summary: {
        value: num,
        integer: Number.isInteger(num),
        finite: Number.isFinite(num),
        safe: Number.isSafeInteger(num)
      },
      metadata: {
        sign: Math.sign(num),
        magnitude: Math.abs(num),
        scientific: num.toExponential(),
        formatted: num.toLocaleString()
      },
      insights: generateNumberInsights(num)
    };
  }

  /**
   * Inspect Function
   */
  function inspectFunction(fn, opts) {
    return {
      type: 'function',
      summary: {
        name: fn.name || 'anonymous',
        length: fn.length, // Parameter count
        isAsync: fn.constructor.name === 'AsyncFunction',
        isGenerator: fn.constructor.name === 'GeneratorFunction'
      },
      structure: {
        source: fn.toString().slice(0, 200) + '...'
      },
      insights: []
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PATTERN DETECTION
  // ═══════════════════════════════════════════════════════════════════════
  
  function detectDOMPatterns(el) {
    const patterns = [];
    
    // Grid/Flex container
    const computed = window.getComputedStyle(el);
    if (computed.display === 'grid') patterns.push({ type: 'css-grid', confidence: 1.0 });
    if (computed.display === 'flex') patterns.push({ type: 'flexbox', confidence: 1.0 });
    
    // Form element
    if (['FORM', 'INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(el.tagName)) {
      patterns.push({ type: 'form-element', confidence: 1.0 });
    }
    
    // Interactive element
    if (el.onclick || el.addEventListener || el.hasAttribute('onclick')) {
      patterns.push({ type: 'interactive', confidence: 0.9 });
    }
    
    // List structure
    if (['UL', 'OL'].includes(el.tagName)) {
      patterns.push({ type: 'list', confidence: 1.0 });
    }
    
    return patterns;
  }

  function detectArrayPatterns(arr) {
    const patterns = [];
    
    // Sequence detection
    if (isArithmeticSequence(arr)) {
      patterns.push({ type: 'arithmetic-sequence', confidence: 1.0 });
    }
    
    // Repeating elements
    const repetitions = detectRepetitions(arr);
    if (repetitions.length > 0) {
      patterns.push({ type: 'repetitions', data: repetitions, confidence: 0.8 });
    }
    
    // Sorted check
    const sorted = isSorted(arr);
    if (sorted.ascending || sorted.descending) {
      patterns.push({ 
        type: 'sorted', 
        direction: sorted.ascending ? 'ascending' : 'descending',
        confidence: 0.9 
      });
    }
    
    return patterns;
  }

  function detectObjectPatterns(obj, keys) {
    const patterns = [];
    
    // Configuration object pattern
    if (keys.some(k => ['config', 'options', 'settings'].includes(k.toLowerCase()))) {
      patterns.push({ type: 'configuration', confidence: 0.7 });
    }
    
    // API response pattern
    if (keys.includes('data') || keys.includes('status') || keys.includes('message')) {
      patterns.push({ type: 'api-response', confidence: 0.7 });
    }
    
    // Coordinate/position pattern
    if (keys.includes('x') && keys.includes('y')) {
      patterns.push({ type: 'coordinates', confidence: 0.9 });
    }
    
    // Timestamp pattern
    if (keys.some(k => ['timestamp', 'createdAt', 'updatedAt', 'date'].includes(k))) {
      patterns.push({ type: 'timestamped', confidence: 0.8 });
    }
    
    return patterns;
  }

  function detectStringPatterns(str) {
    const patterns = [];
    
    // URL
    if (/^https?:\/\//.test(str)) patterns.push({ type: 'url', confidence: 1.0 });
    
    // Email
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) patterns.push({ type: 'email', confidence: 0.9 });
    
    // JSON
    if (str.trim().startsWith('{') || str.trim().startsWith('[')) {
      try {
        JSON.parse(str);
        patterns.push({ type: 'json', confidence: 1.0 });
      } catch (e) {}
    }
    
    // Phone number (basic UK pattern)
    if (/^(\+44|0)[0-9\s]{9,13}$/.test(str.replace(/\s+/g, ''))) {
      patterns.push({ type: 'phone-uk', confidence: 0.8 });
    }
    
    // Date
    if (/^\d{4}-\d{2}-\d{2}/.test(str) || /^\d{2}\/\d{2}\/\d{4}/.test(str)) {
      patterns.push({ type: 'date', confidence: 0.8 });
    }
    
    return patterns;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // INSIGHT GENERATION
  // ═══════════════════════════════════════════════════════════════════════
  
  function generateDOMInsights(analysis) {
    const insights = [];
    
    if (!analysis.metadata.visibility.visible) {
      insights.push({ level: 'info', message: 'Element is not visible' });
    }
    
    if (analysis.structure.children > 20) {
      insights.push({ level: 'warning', message: `Large number of children (${analysis.structure.children})` });
    }
    
    if (analysis.metadata.dimensions && analysis.metadata.dimensions.width === 0) {
      insights.push({ level: 'warning', message: 'Element has zero width' });
    }
    
    return insights;
  }

  function generateArrayInsights(analysis) {
    const insights = [];
    
    if (analysis.summary.isEmpty) {
      insights.push({ level: 'info', message: 'Array is empty' });
    }
    
    if (analysis.summary.length > 1000) {
      insights.push({ level: 'warning', message: `Large array (${analysis.summary.length} items)` });
    }
    
    if (analysis.structure.homogeneous) {
      insights.push({ level: 'info', message: `Homogeneous array of ${analysis.structure.types[0]}s` });
    }
    
    if (analysis.anomalies && analysis.anomalies.length > 0) {
      insights.push({ level: 'warning', message: `${analysis.anomalies.length} anomalies detected` });
    }
    
    return insights;
  }

  function generateObjectInsights(analysis) {
    const insights = [];
    
    if (analysis.summary.isEmpty) {
      insights.push({ level: 'info', message: 'Object is empty' });
    }
    
    if (analysis.structure.depth > 5) {
      insights.push({ level: 'warning', message: `Deep nesting (depth ${analysis.structure.depth})` });
    }
    
    if (analysis.structure.circular) {
      insights.push({ level: 'warning', message: 'Circular reference detected' });
    }
    
    if (analysis.metadata.frozen) {
      insights.push({ level: 'info', message: 'Object is frozen (immutable)' });
    }
    
    return insights;
  }

  function generateStringInsights(analysis) {
    const insights = [];
    
    if (analysis.summary.isEmpty) {
      insights.push({ level: 'info', message: 'String is empty' });
    }
    
    if (analysis.summary.length > 10000) {
      insights.push({ level: 'warning', message: `Very long string (${analysis.summary.length} chars)` });
    }
    
    if (analysis.structure.lines > 100) {
      insights.push({ level: 'info', message: `Multi-line document (${analysis.structure.lines} lines)` });
    }
    
    return insights;
  }

  function generateNumberInsights(num) {
    const insights = [];
    
    if (!Number.isFinite(num)) {
      insights.push({ level: 'warning', message: 'Number is not finite' });
    }
    
    if (!Number.isSafeInteger(num) && Number.isInteger(num)) {
      insights.push({ level: 'warning', message: 'Integer outside safe range' });
    }
    
    if (num === 0) {
      insights.push({ level: 'info', message: 'Zero value' });
    }
    
    return insights;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // METRICS & STATISTICS
  // ═══════════════════════════════════════════════════════════════════════
  
  function calculateNumericMetrics(numbers) {
    if (numbers.length === 0) return null;
    
    const sorted = [...numbers].sort((a, b) => a - b);
    const sum = numbers.reduce((a, b) => a + b, 0);
    const mean = sum / numbers.length;
    
    return {
      count: numbers.length,
      sum,
      mean,
      median: sorted[Math.floor(sorted.length / 2)],
      min: sorted[0],
      max: sorted[sorted.length - 1],
      range: sorted[sorted.length - 1] - sorted[0],
      standardDeviation: calculateStdDev(numbers, mean)
    };
  }

  function calculateStdDev(numbers, mean) {
    const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
    return Math.sqrt(variance);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // HELPER FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════
  
  function getTargetType(target) {
    if (target === null) return 'null';
    if (target === undefined) return 'undefined';
    if (target instanceof HTMLElement) return 'dom-element';
    if (Array.isArray(target)) return 'array';
    if (typeof target === 'function') return 'function';
    if (typeof target === 'object') return 'object';
    return typeof target;
  }

  function getAttributes(el) {
    const attrs = {};
    if (el.attributes) {
      for (const attr of el.attributes) {
        attrs[attr.name] = attr.value;
      }
    }
    return attrs;
  }

  function getSiblingCount(el) {
    return {
      previous: el.previousElementSibling ? 1 + getSiblingCount(el.previousElementSibling).previous : 0,
      next: el.nextElementSibling ? 1 + getSiblingCount(el.nextElementSibling).next : 0
    };
  }

  function getElementDepth(el) {
    let depth = 0;
    let current = el;
    while (current.parentElement) {
      depth++;
      current = current.parentElement;
    }
    return depth;
  }

  function isElementVisible(el) {
    const computed = window.getComputedStyle(el);
    return computed.display !== 'none' && 
           computed.visibility !== 'hidden' && 
           computed.opacity !== '0';
  }

  function isInViewport(el) {
    if (!el.getBoundingClientRect) return null;
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    );
  }

  function getComputedStyleSummary(el) {
    const computed = window.getComputedStyle(el);
    return {
      display: computed.display,
      position: computed.position,
      backgroundColor: computed.backgroundColor,
      color: computed.color,
      fontSize: computed.fontSize
    };
  }

  function getArrayTypes(arr) {
    const types = new Set();
    arr.forEach(item => types.add(typeof item));
    return Array.from(types);
  }

  function isHomogeneous(arr) {
    if (arr.length === 0) return true;
    const firstType = typeof arr[0];
    return arr.every(item => typeof item === firstType);
  }

  function hasNestedStructures(arr) {
    return arr.some(item => typeof item === 'object' && item !== null);
  }

  function getMaxDepth(obj, current, max) {
    if (current >= max) return current;
    if (typeof obj !== 'object' || obj === null) return current;
    
    if (Array.isArray(obj)) {
      return Math.max(...obj.map(item => getMaxDepth(item, current + 1, max)), current);
    }
    
    return Math.max(
      ...Object.values(obj).map(value => getMaxDepth(value, current + 1, max)),
      current
    );
  }

  function calculateObjectDepth(obj, current, max) {
    if (current >= max) return current;
    if (typeof obj !== 'object' || obj === null) return current;
    
    const depths = Object.values(obj)
      .filter(v => typeof v === 'object' && v !== null)
      .map(v => calculateObjectDepth(v, current + 1, max));
    
    return depths.length > 0 ? Math.max(...depths) : current;
  }

  function getObjectValueTypes(values) {
    const types = new Set();
    values.forEach(val => types.add(typeof val));
    return Array.from(types);
  }

  function hasCircularReference(obj, seen = new WeakSet()) {
    if (typeof obj !== 'object' || obj === null) return false;
    if (seen.has(obj)) return true;
    
    seen.add(obj);
    
    for (const value of Object.values(obj)) {
      if (hasCircularReference(value, seen)) return true;
    }
    
    return false;
  }

  function isArithmeticSequence(arr) {
    if (arr.length < 3) return false;
    if (!arr.every(x => typeof x === 'number')) return false;
    
    const diff = arr[1] - arr[0];
    for (let i = 2; i < arr.length; i++) {
      if (arr[i] - arr[i - 1] !== diff) return false;
    }
    return true;
  }

  function detectRepetitions(arr) {
    const counts = {};
    arr.forEach(item => {
      const key = JSON.stringify(item);
      counts[key] = (counts[key] || 0) + 1;
    });
    
    return Object.entries(counts)
      .filter(([_, count]) => count > 1)
      .map(([key, count]) => ({ value: JSON.parse(key), count }))
      .sort((a, b) => b.count - a.count);
  }

  function isSorted(arr) {
    if (!arr.every(x => typeof x === 'number')) return { ascending: false, descending: false };
    
    let ascending = true;
    let descending = true;
    
    for (let i = 1; i < arr.length; i++) {
      if (arr[i] < arr[i - 1]) ascending = false;
      if (arr[i] > arr[i - 1]) descending = false;
    }
    
    return { ascending, descending };
  }

  function detectArrayAnomalies(arr) {
    const anomalies = [];
    
    // For numeric arrays, use Interquartile Range (IQR) for more robust outlier detection
    if (arr.every(x => typeof x === 'number')) {
      const metrics = calculateNumericMetrics(arr);
      const sorted = [...arr].sort((a, b) => a - b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;
      
      arr.forEach((val, idx) => {
        if (val < lowerBound || val > upperBound) {
          anomalies.push({
            index: idx,
            value: val,
            type: 'iqr-outlier',
            deviation: Math.abs(val - metrics.mean),
            severity: val < (q1 - 3 * iqr) || val > (q3 + 3 * iqr) ? 'extreme' : 'mild'
          });
        }
      });
    }
    
    return anomalies;
  }

  function generateCacheKey(target) {
    if (target instanceof HTMLElement) {
      return `dom:${target.tagName}:${target.id || 'no-id'}`;
    }
    return `generic:${typeof target}:${Date.now()}`;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // BATCH ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Analyze multiple targets in batch
   */
  GraceX.Analytics.batchInspect = function(targets, options = {}) {
    const results = targets.map(target => GraceX.Analytics.inspect(target, options));
    
    return {
      count: results.length,
      successful: results.filter(r => !r.error).length,
      failed: results.filter(r => r.error).length,
      results,
      summary: {
        types: [...new Set(results.map(r => r.type))],
        totalProcessingTime: results.reduce((sum, r) => sum + (r.processingTime || 0), 0)
      }
    };
  };

  /**
   * Compare two targets
   */
  GraceX.Analytics.compare = function(target1, target2, options = {}) {
    const analysis1 = GraceX.Analytics.inspect(target1, options);
    const analysis2 = GraceX.Analytics.inspect(target2, options);
    
    return {
      target1: analysis1,
      target2: analysis2,
      comparison: {
        sameType: analysis1.type === analysis2.type,
        differences: findDifferences(analysis1, analysis2)
      }
    };
  };

  function findDifferences(a1, a2) {
    const diffs = [];
    
    if (a1.type !== a2.type) {
      diffs.push({ field: 'type', value1: a1.type, value2: a2.type });
    }
    
    // Add more specific comparison logic based on type
    
    return diffs;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // REGEX EXTRACTION SUITE
  // ═══════════════════════════════════════════════════════════════════════
  
  const REGEX_LIBRARY = {
    urls: /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)/gi,
    emails: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
    phoneNumbers: /(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?/gi,
    hashtags: /#[\w]+/gi,
    mentions: /@[\w]+/gi,
    currency: /[$€£¥]\s*\d+(?:,\d{3})*(?:\.\d{2})?/gi
  };

  /**
   * Extract targeted data from text using standard regex patterns
   * @param {string} text - The input text to parse
   * @param {string} patternType - 'urls', 'emails', 'phoneNumbers', 'hashtags', 'mentions', 'currency', or 'all'
   * @returns {array|object} Array of matches, or object grouping all matches
   */
  GraceX.Analytics.extract = function(text, patternType = 'all') {
    if (typeof text !== 'string') return null;

    if (patternType === 'all') {
      const results = {};
      for (const [key, regex] of Object.entries(REGEX_LIBRARY)) {
        results[key] = text.match(regex) || [];
      }
      return results;
    }

    if (!REGEX_LIBRARY[patternType]) {
      console.warn(`[ANALYTICS] Unknown regex pattern type: ${patternType}`);
      return [];
    }

    return text.match(REGEX_LIBRARY[patternType]) || [];
  };

  // ═══════════════════════════════════════════════════════════════════════
  // TIME-SERIES ANOMALIES
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Detect sudden spikes/drops in numerical series data (baseline velocity logic)
   */
  GraceX.Analytics.detectTimeSeriesAnomalies = function(dataPoints) {
    if (!Array.isArray(dataPoints) || dataPoints.length < 3) return [];
    if (!dataPoints.every(x => typeof x === 'number')) return [];

    const anomalies = [];
    const windowSize = 3; // Basic moving average window
    
    for (let i = windowSize; i < dataPoints.length; i++) {
        const windowData = dataPoints.slice(i - windowSize, i);
        const baseline = windowData.reduce((a, b) => a + b, 0) / windowSize;
        const current = dataPoints[i];
        
        // Define an anomaly as a > 50% deviation from the local baseline
        const deviationPercent = Math.abs(current - baseline) / (baseline || 1);
        
        if (deviationPercent > 0.5) {
            anomalies.push({
                index: i,
                value: current,
                baseline: baseline,
                deviationPercent: (deviationPercent * 100).toFixed(2) + '%',
                type: current > baseline ? 'spike' : 'drop'
            });
        }
    }
    
    return anomalies;
  };

  /**
   * Clear analysis cache
   */
  GraceX.Analytics.clearCache = function() {
    const size = ANALYSIS_CACHE.size;
    ANALYSIS_CACHE.clear();
    console.log(`[ANALYTICS] Cache cleared: ${size} entries removed`);
    return size;
  };

  /**
   * Get analytics statistics
   */
  GraceX.Analytics.getStats = function() {
    return {
      cacheSize: ANALYSIS_CACHE.size,
      config: ANALYTICS_CONFIG
    };
  };

  console.log("[GRACE-X ANALYTICS BRAIN] v1.0.0 loaded ✓");
  console.log("[ANALYTICS] Pattern detection: ON | Anomaly detection: ON | Extractor: ON");
  
})();
