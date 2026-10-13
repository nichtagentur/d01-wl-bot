// Builds stops.json (name -> DIVA) from the Wien OGD catalog. Run: node scripts/build-stops.js
const fs = require('fs'), path = require('path');
(async () => {
  const csv = await (await fetch('https://data.wien.gv.at/csv/wienerlinien-ogd-haltestellen.csv')).text();
  const stops = [];
  for (const line of csv.split('\n').slice(1)) {
    const c = line.split(';').map(s => s.replace(/^"|"$/g, '').trim());
    if (c.length > 4 && c[2] && c[3] && c[5] === '90001') stops.push({ name: c[3], diva: c[2] });
  }
  fs.writeFileSync(path.join(__dirname, '..', 'stops.json'), JSON.stringify(stops));
  console.log(stops.length, 'stops');
})();
