# Live tests (https://d01-wl-bot.vercel.app/api/chat, 2026-10-13 ~13:50)

1. "When does the next U1 leave Stephansplatz?" -> Leopoldau in 1 min (13:52), Alaudagasse in 4 min (13:54). Matched the live API (ubahn.py: Leopoldau 13:52 planned 13:53). Alaudagasse (4 min, 13:54) also matched a re-run of ubahn.py (the earlier run showed Oberlaa, the terminus changes with short-turn trains).
2. "Are there disruptions on the U6?" -> none reported. Matched: trafficInfoList has 0 entries for U6 at test time.
3. "When is the next U3 at Westbahnhof?" -> Simmering now/13:52/13:57, Ottakring now/13:51/13:57. Matched ubahn.py exactly, including delays vs planned.

Note: the three runs were a minute apart from the API check; times move by a minute.
