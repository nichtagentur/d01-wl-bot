#!/usr/bin/env node
// Usage: node brain-cli.js "when does the next U1 leave Stephansplatz?"  (key from env, e.g. source ~/.env)
require('./brain').answer(process.argv.slice(2).join(' ')).then(t => console.log(t), e => { console.error('Error:', e.message); process.exit(1); });
