const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const key = process.env.OPENAI_API_KEY;
console.log('[TEST] Using key:', key ? key.slice(0,12) + '...' : 'NONE');

fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ model: 'gpt-4o-mini', max_tokens: 10, messages: [{ role: 'user', content: 'hi' }] }),
}).then(async r => {
  const body = await r.json();
  if (!r.ok) {
    console.error('[TEST] FAILED:', r.status, JSON.stringify(body.error));
  } else {
    console.log('[TEST] SUCCESS:', body.choices?.[0]?.message?.content);
  }
}).catch(e => console.error('[TEST] NETWORK ERROR:', e.message));
