# Course narration (audio)

Pilot: Module 2 only. Scripts live in `docs/audio/*.script.md`; the lesson shows each script as the transcript (markdown include), so spoken and written text are one file.

- **Voice:** ElevenLabs *premade stock voice* "River" (`SAz9YHcvj6GT2YYXdXww`), model `eleven_multilingual_v2`, see `docs/audio/voice.json`. It is not a clone of any person. Voice Design (a custom designed voice) is not available through the API on the free plan; if a paid plan is added, design a voice, update `voice.json` and re-render.
- **Render (offline, costs money, needs `ELEVENLABS_API_KEY`):** `node scripts/build-audio.mjs` (`--dry` to preview cost, `--only <id>`). Only scripts whose hash changed are rendered.
- **Check (CI, free):** `npm run check:audio` fails if any script has no current mp3.
- **Cost log:** `docs/audio/usage.json` (characters and USD at $0.08 per 1,000 characters).
- Scripts avoid code, links and version numbers so a Mastra release rarely forces a re-render.
- Do not strip the ID3 comment or vendor metadata from the mp3 files. The AI-voice label next to every player must stay.
