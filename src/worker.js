// BillKind — Cloudflare Worker.
// Serves the static demo (public/billkind) and two small endpoints:
//   POST /billkind/api/waitlist  -> saves the contact in Resend + notifies MAIL_TO
//   POST /billkind/api/contact   -> emails the message to MAIL_TO
// No database: Resend contacts are the waitlist.

const BASE = "/billkind";
const RESEND = "https://api.resend.com";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ROLES = { give: "Vuole donare", get: "Ha bisogno di una mano", both: "Entrambi" };
const TOPICS = { partnerships: "Partnerships", build: "Help build this" };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === `${BASE}/api/waitlist`) return api(request, env, waitlist);
    if (url.pathname === `${BASE}/api/contact`) return api(request, env, contact);
    if (url.pathname.startsWith(`${BASE}/api/`)) return json({ ok: false, error: "not_found" }, 404);
    if (url.pathname === "/") return Response.redirect(`${url.origin}${BASE}/`, 302);
    return env.ASSETS.fetch(request);
  },
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

async function api(request, env, handler) {
  if (request.method !== "POST") return json({ ok: false, error: "method" }, 405);
  // Same-origin only: the forms are never meant to be posted from other sites.
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return json({ ok: false, error: "origin" }, 403);
  }
  let data;
  try {
    const raw = await request.text();
    if (raw.length > 8000) return json({ ok: false, error: "too_large" }, 413);
    data = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: "bad_json" }, 400);
  }
  if (!data || typeof data !== "object") return json({ ok: false, error: "bad_json" }, 400);
  // Honeypot: real people never fill the hidden "website" field. Pretend success.
  if (typeof data.website === "string" && data.website.trim() !== "") return json({ ok: true });
  try {
    return await handler(data, env);
  } catch (err) {
    console.error("api error", err && err.message);
    return json({ ok: false, error: "server" }, 500);
  }
}

const clean = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

async function waitlist(data, env) {
  const email = clean(data.email, 200).toLowerCase();
  const role = Object.hasOwn(ROLES, data.role) ? data.role : "both";
  const lang = data.lang === "en" ? "en" : "it";
  if (!EMAIL_RE.test(email)) return json({ ok: false, error: "email" }, 400);

  // Best effort: store the contact in Resend. The notification email below is the fallback record.
  if (env.RESEND_API_KEY && env.MAIL_DRY_RUN !== "1") {
    const body = { email, unsubscribed: false };
    if (env.RESEND_SEGMENT_ID) body.segments = [{ id: env.RESEND_SEGMENT_ID }];
    const res = await fetch(`${RESEND}/contacts`, {
      method: "POST",
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok && res.status !== 409) console.warn("resend contact failed", res.status);
  }

  const sent = await sendMail(env, {
    subject: `BillKind · nuova iscrizione alla lista d'attesa (${ROLES[role]})`,
    text: [
      "Nuova iscrizione alla lista d'attesa di BillKind.",
      "",
      `Email: ${email}`,
      `Interesse: ${ROLES[role]}`,
      `Lingua: ${lang}`,
      `Data: ${new Date().toISOString()}`,
    ].join("\n"),
    replyTo: email,
  });
  return sent ? json({ ok: true }) : json({ ok: false, error: "mail" }, 502);
}

async function contact(data, env) {
  const name = clean(data.name, 120);
  const email = clean(data.email, 200).toLowerCase();
  const message = clean(data.message, 4000);
  const lang = data.lang === "en" ? "en" : "it";
  if (!EMAIL_RE.test(email)) return json({ ok: false, error: "email" }, 400);
  if (!Object.hasOwn(TOPICS, data.topic)) return json({ ok: false, error: "topic" }, 400);
  if (message.length < 5) return json({ ok: false, error: "message" }, 400);

  const sent = await sendMail(env, {
    subject: `BillKind · ${TOPICS[data.topic]}${name ? ` · ${name.replace(/[\r\n]+/g, " ")}` : ""}`,
    text: [
      `Argomento: ${TOPICS[data.topic]}`,
      `Nome: ${name || "(non indicato)"}`,
      `Email: ${email}`,
      `Lingua: ${lang}`,
      "",
      message,
    ].join("\n"),
    replyTo: email,
  });
  return sent ? json({ ok: true }) : json({ ok: false, error: "mail" }, 502);
}

async function sendMail(env, { subject, text, replyTo }) {
  if (env.MAIL_DRY_RUN === "1") {
    console.log("[dry run] mail to", env.MAIL_TO, "|", subject, "\n" + text);
    return true;
  }
  if (!env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not configured");
    return false;
  }
  const res = await fetch(`${RESEND}/emails`, {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: env.MAIL_FROM, to: [env.MAIL_TO], reply_to: replyTo, subject, text }),
  });
  if (!res.ok) console.error("resend email failed", res.status, await res.text());
  return res.ok;
}
