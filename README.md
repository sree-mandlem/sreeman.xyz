# sreeman.xyz

Personal portfolio and learning lab — a space for building things, breaking assumptions, and learning in public.

**Live at [https://sreeman.xyz](https://sreeman.xyz)**

---

## What this is

A content-first personal site where Sreeman (a senior backend engineer) documents:
- **Blog** → long-form posts on engineering, AI adoption, lessons learned
- **Projects** → things being built, from portfolio sites to tools
- **Experiments** → quick explorations, trying new frameworks and ideas

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Astro 5 |
| Language | TypeScript |
| Hosting | Cloudflare Workers |
| Domain | sreeman.xyz (via Cloudflare Registrar) |
| SSL | Cloudflare-managed, Full (strict) |
| Testing | Playwright (Chromium, 15 e2e tests) |
| Content | Markdown/MDX content collections |

---

## Project structure

```
src/
├── components/         # Shared components (Header, Footer, BaseHead, etc.)
├── content/
│   ├── blog/           # Blog posts (markdown)
│   ├── projects/       # Project entries (markdown)
│   └── experiments/    # Experiment entries (markdown)
├── layouts/
│   └── BlogPost.astro  # Shared layout for all detail pages
├── pages/
│   ├── blog/           # Blog index + [slug] detail
│   ├── projects/       # Projects index + [slug] detail
│   ├── experiments/    # Experiments index + [slug] detail
│   ├── about.astro     # About page
│   └── index.astro     # Landing page
├── styles/
│   └── global.css      # Design tokens and base styles
├── utils/
│   └── readTime.ts     # Read time calculator
└── consts.ts           # Site-wide constants
tests/                  # Playwright e2e tests
```

---

## Commands

```bash
npm install              # Install dependencies
npm run dev              # Start dev server (port 4321)
npm run build            # Production build → dist/
npm run deploy           # Deploy to Cloudflare (run build first!)
npm run check            # Full validation: build + tsc + deploy dry-run
npm test                 # Run Playwright tests
npm run test:ui          # Playwright visual runner
```

**Important:** `npm run deploy` does NOT rebuild. Always run `npm run build && npm run deploy`.

---

## Publishing workflow

Every meaningful change is treated as a **deployment**. See [`SYSTEM.md`](./SYSTEM.md) for the full playbook.

Quick flow:
1. Make changes locally
2. `npm run build` → verify
3. `npx playwright test` → verify tests pass
4. `git commit -m "deploy: <description>"`
5. `npm run deploy` → push to Cloudflare
6. `git push origin main`
7. Verify on https://sreeman.xyz

---

## System docs

- [`SYSTEM.md`](./SYSTEM.md) — Publishing system and deployment playbook
- [`.github/copilot-instructions.md`](./.github/copilot-instructions.md) — Full architecture reference for AI agents
- [`.github/model-guide.md`](./.github/model-guide.md) — Model selection guide for Copilot CLI