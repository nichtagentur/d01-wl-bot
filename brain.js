// The brain: answer(question) -> text. Used by the web app (api/chat.js), the CLI and (next lesson) the email agent.
const wl = require('./wl');
const MODEL = 'deepseek/deepseek-v4.1-flash';
const SYSTEM = 'You are a Vienna public transport assistant. Use the tools for live data; never invent departures or disruptions. ' +
  'Answer in the language of the question, short and plain. Mention times in minutes and clock time. If a tool returns nothing, say so.';
const TOOLS = [
  { type: 'function', function: { name: 'get_departures', description: 'Live next departures at a Vienna stop (U-Bahn, tram, bus).',
    parameters: { type: 'object', properties: { stop: { type: 'string', description: 'Stop name, e.g. Stephansplatz' }, line: { type: 'string', description: 'Optional line, e.g. U1' } }, required: ['stop'] } } },
  { type: 'function', function: { name: 'get_disruptions', description: 'Current disruptions and outages, optionally for one line.',
    parameters: { type: 'object', properties: { line: { type: 'string', description: 'Optional line, e.g. U6' } } } } },
];

async function callTool(name, args) {
  try {
    if (name === 'get_departures') return await wl.getDepartures(args.stop, args.line);
    if (name === 'get_disruptions') return await wl.getDisruptions(args.line);
    return { error: 'unknown tool' };
  } catch (e) { return { error: String(e.message || e) }; }
}

async function chat(messages, key) {
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, messages, tools: TOOLS, max_tokens: 1500 }),
  });
  if (!r.ok) { const e = new Error('OpenRouter HTTP ' + r.status); e.status = r.status; throw e; }
  return (await r.json()).choices[0].message;
}

// history: optional earlier [{role,content}] turns.
async function answerWith(question, history, key) {
  const messages = [{ role: 'system', content: SYSTEM }, ...(history || []), { role: 'user', content: question }];
  for (let i = 0; i < 5; i++) {
    const msg = await chat(messages, key);
    if (!msg.tool_calls || !msg.tool_calls.length) return (msg.content || '').trim();
    messages.push(msg);
    for (const tc of msg.tool_calls) {
      let args = {}; try { args = JSON.parse(tc.function.arguments || '{}'); } catch (e) {}
      messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(await callTool(tc.function.name, args)) });
    }
  }
  return 'Sorry, I could not finish that request.';
}

async function answer(question, history) {
  const keys = [process.env.OPENROUTER_API_KEY, process.env.OPENROUTER_BACKUP_API_KEY].filter(Boolean);
  let err;
  for (const k of keys) {
    try { return await answerWith(question, history, k); }
    catch (e) { err = e; if (![401, 402].includes(e.status)) throw e; }
  }
  throw err || new Error('No OPENROUTER_API_KEY set');
}

module.exports = { answer };
