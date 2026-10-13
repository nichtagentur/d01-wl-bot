# d01-wl-bot: Wiener Linien chat bot

Chat web app: DeepSeek (`deepseek/deepseek-v4.1-flash` via OpenRouter) calls the live Wiener Linien API as tools.

- `wl.js`: single source for the stop list (`stops.json`, built by `node scripts/build-stops.js`) and the live API (`getDepartures(stop, line)`, `getDisruptions(line)`).
- `brain.js`: `answer(question, history?) -> Promise<string>`. Tool-calling loop. Uses `OPENROUTER_API_KEY`, falls back to `OPENROUTER_BACKUP_API_KEY` on 401/402. Reuse this in the email agent: `const {answer}=require('./brain')`.
- `brain-cli.js`: `source ~/.env; node brain-cli.js "are there disruptions on the U6?"`
- `api/chat.js`: Vercel function, POST `{message, history}` -> `{answer}`. `public/index.html`: the chat page.
- Key stays on the server: Vercel env var `OPENROUTER_API_KEY`, never in code or the page.
- Deploy: `vercel+ deploy --yes --prod` (project d01-wl-bot). Share the `Aliased:` URL only. Tests: `TESTS.md`.
