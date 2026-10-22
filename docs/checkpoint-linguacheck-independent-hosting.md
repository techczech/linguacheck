---
title: LinguaCheck independent hosting checkpoint
date: 2026-10-22
status: checked-awaiting-independent-review
---

# Implementation plan

- Preserve translation, back-translation, evaluation and saved results.
- Require the visitor's key at the service boundary; remove environment fallback and Vite key injection.
- Keep the key in memory by default; persist only on explicit selection and clear explicitly. Existing saved results remain accessible without a key.
- Replace AI Studio import-map packaging with a real Vite module entry; compile existing Tailwind styles locally.
- Verify missing-key and mocked provider paths, key storage, credential-free build and browser behaviour. Preserve all existing prompts.
- Save a feature commit and push it. No deployment or paid model calls.

# Validation

- Date: 2026-10-22. Agent: OpenAI Codex GPT-6-Astra in T3 Code.
- Node unit tests: 7 passed; TypeScript check passed; production Vite build passed without credentials.
- Missing-key rejection; visitor header and URL checks; safe authentication errors; cancelled retry regression; explicit storage opt-in and clearing. Browser: all three translation stages, JSON export, keyless saved results, memory-only default, opt-in persistence, clearing and desktop/mobile.
- Isolated Playwright Chromium. All provider traffic mocked; external requests blocked. Synthetic keys only. Browser page errors: none. Screenshots checked.
- Runtime dependency audit at installation: zero known vulnerabilities. Tailwind 3 build tooling has 7 transitive advisories (5 high, 2 moderate); no forced major upgrade or style redesign performed. Vite warns about a bundle larger than 500 kB.
- Source prompts and existing model choices preserved. Model availability, live API/CORS behaviour and publication remain unverified.
- No public deployment, DNS change or Google Cloud shutdown. The output to publish later is `dist/`.

# Recovery

Branch: `feat/independent-own-key-web`. Re-run `npm ci`, `npm test`, `npm run typecheck`, `npm run build`. Browser evidence lives under `research/`; local automation scratch is ignored. Saved user data stays in its existing browser storage keys.
