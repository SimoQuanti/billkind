# BillKind

**One bill, one helping hand.** People going through a hard time share a bill or a story; those who can, pay it.

This repository is the **interactive demo (MVP)**: no real payments, no real people. Every request, story, donor and leaderboard figure is fictional.

> 🇮🇹 Demo interattiva di BillKind: chi è in difficoltà condivide una bolletta o una storia, chi può la paga. Nessun pagamento reale, tutti i dati sono inventati.

## What's in the demo

- **Discover** – swipe through bills and stories (Italy, Switzerland, UK), add them to a basket, confirm a demo gift.
- **Profiles** – every person has a profile: either **anonymous** (city, amount, one line) or **full** (bio, story, updates).
- **Leaderboard** – top givers by month, year and all time, including anonymous givers, creators and companies.
- **Ask for a hand** – simulated request flow with the verification steps a real pilot would need.
- **Your profile** – choose anonymous or full; stored only in the browser.
- **Waitlist & contact** – the only two things that leave the browser.
- **Italian / English** – switch with the flags in the header.

## Stack

Deliberately small: static HTML/CSS/JS (no framework, no build) served by one Cloudflare Worker.

```
public/billkind/   static site (index.html, styles.css, app.js, data.js, i18n.js, logo.svg)
src/worker.js      POST /billkind/api/waitlist and /billkind/api/contact (Resend)
wrangler.jsonc     Worker config, route www.sqstudio.ch/billkind*
```

There is no database. A waitlist signup is saved as a Resend contact and a notification is emailed to the team; contact messages are emailed directly.

## Run locally

```bash
npm install
cp .dev.vars.example .dev.vars   # MAIL_DRY_RUN=1 logs emails instead of sending
npm run dev                      # http://localhost:8787/billkind/
```

## Deploy

```bash
npx wrangler secret put RESEND_API_KEY
npm run deploy
```

Optional: set `RESEND_SEGMENT_ID` to add waitlist contacts to a specific Resend segment.

## A note on brands

The demo shows bill **categories** (electricity, gas, phone…) rather than real provider logos. Using a company's logo without permission can suggest a partnership that doesn't exist; real logos belong in the product once those partnerships do.

## Fonts

Marcellus (logo and headings) and Jost (text), both under the SIL Open Font License, self-hosted in `public/billkind/fonts` so the page makes no third-party requests.
