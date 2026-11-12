# BillKind demo — design notes (2026-11-12)

**Goal.** A web demo to show prospective co-founders and partners how BillKind would work in Europe. No real payments, fictional data.

**Decisions**
- Flow mirrors the "give a hand / get a hand" model: welcome → choice → discover → basket → demo gift.
- Requests are either a **bill** (paid in full) or a **story** (a goal people chip in to, e.g. medical care).
- Every person has a profile, **anonymous** or **full** (bio + story). The demo data shows both, for people asking and for givers.
- Leaderboard of givers by month / year / all time; the visitor's demo gifts place them on it.
- Bilingual IT/EN, flag switch, choice remembered in the browser.
- No real provider logos: categories and icons only (trademark use without permission implies affiliation).
- No database: waitlist = Resend contacts + notification email to info@sqstudio.ch. Contact form topics: Partnerships, Help build this.
- Hosting: one Cloudflare Worker with static assets on the route `www.sqstudio.ch/billkind*` (a Route takes precedence over the main site's Custom Domain).
- Palette: cream background, deep teal (trust), terracotta and amber accents (warmth). System fonts only, no third-party requests.

**Out of scope for the demo.** Accounts, real uploads, payments, identity/bill verification, moderation.
