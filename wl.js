// Single source of truth for Wiener Linien: stop list + live API calls.
const STOPS = require('./stops.json');
const BASE = 'https://www.wienerlinien.at/ogd_realtime';

const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss')
  .replace(/\bstr\./g, 'strasse').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

function findStops(query, max = 3) {
  const q = norm(query).replace(/ u$/, '');
  if (!q) return [];
  const scored = STOPS.map(s => {
    const n = norm(s.name);
    return { s, score: n === q ? 0 : n.startsWith(q) ? 1 : n.includes(q) ? 2 : 9, len: n.length };
  }).filter(x => x.score < 9).sort((a, b) => a.score - b.score || a.len - b.len);
  return scored.slice(0, max).map(x => x.s);
}

async function getJson(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'd01-wl-bot' } });
  if (!r.ok) throw new Error('Wiener Linien API HTTP ' + r.status);
  return r.json();
}

// Next departures for a stop name. Returns { stop, serverTime, lines:[{line,towards,departures:[{minutes,time,planned}]}] }
async function getDepartures(stopName, line) {
  const stop = findStops(stopName, 1)[0];
  if (!stop) return { error: 'No stop found for "' + stopName + '"' };
  const j = await getJson(`${BASE}/monitor?diva=${stop.diva}`);
  const out = [];
  for (const m of j.data.monitors || []) {
    for (const l of m.lines || []) {
      if (line && norm(l.name) !== norm(line)) continue;
      out.push({
        line: l.name, towards: l.towards,
        departures: (l.departures.departure || []).slice(0, 4).map(d => ({
          minutes: d.departureTime.countdown, time: (d.departureTime.timeReal || d.departureTime.timePlanned || '').slice(11, 16),
          planned: (d.departureTime.timePlanned || '').slice(11, 16) })),
      });
    }
  }
  return { stop: stop.name, serverTime: j.message && j.message.serverTime, lines: out };
}

// Current disruptions, optionally for one line (e.g. "U6").
async function getDisruptions(line) {
  const j = await getJson(`${BASE}/trafficInfoList`);
  let list = j.data.trafficInfos || [];
  if (line) list = list.filter(t => ((t.attributes || {}).relatedLines || []).map(norm).includes(norm(line)));
  return {
    line: line || 'all', count: list.length,
    disruptions: list.slice(0, 8).map(t => ({
      title: t.title, description: (t.description || '').slice(0, 300), status: (t.attributes || {}).status,
      reason: (t.attributes || {}).reason, lines: (t.attributes || {}).relatedLines, until: (t.attributes || {}).ausBis })),
  };
}

module.exports = { findStops, getDepartures, getDisruptions };
