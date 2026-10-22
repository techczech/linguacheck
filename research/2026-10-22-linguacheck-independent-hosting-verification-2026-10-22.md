---
title: "LinguaCheck independent hosting verification 2026-10-22"
kind: "evidence"
created: "2026-10-22T19:22:41Z"
project: "/Users/dominiklukes/gitrepos/07_webapps-websites/03_Google-AI-studio/linguacheck"
sources:
  - file: docs/checkpoint-linguacheck-independent-hosting.md
artefact: "research/independent-hosting-evidence/linguacheck-desktop.png"
---
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
