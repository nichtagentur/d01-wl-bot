const { answer } = require('../brain');
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const q = String(body.message || '').slice(0, 500);
  if (!q) return res.status(400).json({ error: 'message required' });
  const history = (Array.isArray(body.history) ? body.history : []).slice(-6)
    .filter(m => m && ['user', 'assistant'].includes(m.role)).map(m => ({ role: m.role, content: String(m.content).slice(0, 1000) }));
  try { res.status(200).json({ answer: await answer(q, history) }); }
  catch (e) { res.status(502).json({ error: 'The bot is unavailable right now.' }); }
};
