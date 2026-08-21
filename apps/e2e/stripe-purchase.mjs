/**
 * THE END-TO-END PURCHASE. A real browser, a real Stripe checkout, a real
 * webhook, a real ledger row.
 *
 * Added 21 August 2026, session 11. 04 entry 112.
 *
 * This is the test that matters. Everything else in this feature can be proven
 * by reading, reasoning or unit-testing; whether a stranger can hand over money
 * and receive credits cannot. CLAUDE.md section 4: run it and show the output.
 *
 *   cd apps/e2e && node stripe-purchase.mjs [packId]
 *
 * REQUIRES, all of which the session sets up first:
 *   - the dev server on :3000 with STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET
 *   - `stripe listen --forward-to localhost:3000/api/stripe/webhook` running
 *   - a confirmed throwaway buyer from apps/web/scripts/make-test-buyer.mjs
 *
 * Drives the Chrome already on the machine (`channel: 'chrome'`). Do NOT run
 * `npx playwright install`.
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/*
 * SIGNING IN WITHOUT FIGHTING THE CAPTCHA.
 *
 * The first version of this script drove the real sign-in form. It failed with
 * "Sorry, we could not authenticate you" every time: Cloudflare Turnstile is
 * enforced on this project's auth endpoints and it refuses an automated
 * browser, whether headless or headed. That is Turnstile WORKING — a bot being
 * told no is the entire point of it, and the credits system depends on it
 * (see ANON_GRANTS_PER_HOUR_PER_IP in lib/server/credits.ts, which is sized on
 * the assumption that each anonymous account costs a human a captcha).
 *
 * So the session is established the way an operator legitimately can: the
 * ADMIN API issues a one-time magic link, and the browser follows it. This is
 * a verification flow rather than a password sign-in, so no captcha applies.
 * Nothing about the captcha is weakened or bypassed for real users — this
 * script simply is not pretending to be one.
 *
 * What this DOES mean, stated plainly: the sign-in FORM itself is not covered
 * by this test. It is covered by a human signing in, which Jon has done.
 */
const HERE = path.dirname(new URL(import.meta.url).pathname);

const env = {};
for (const f of ['../web/.env', '../web/.env.local']) {
  const p = path.resolve(HERE, f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
}

async function adminMagicLink(email) {
  const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'content-type': 'application/json',
    },
    // redirect_to is TOP LEVEL on the admin endpoint, not nested in options.
    // Nested, it is silently ignored and Supabase falls back to the project's
    // Site URL — which is https://un-claude.com, so the link lands on
    // production instead of the dev server. The fallback below survives that
    // either way.
    body: JSON.stringify({
      type: 'magiclink',
      email,
      redirect_to: 'http://localhost:3000/home',
    }),
  });

  const body = await response.json();

  if (!response.ok) throw new Error(`generate_link failed: ${JSON.stringify(body)}`);

  /*
   * THE HASHED TOKEN, NOT THE ACTION LINK.
   *
   * Two earlier runs failed chasing `action_link`. It performs the IMPLICIT
   * flow, returning the session in a URL fragment — and this app's Supabase
   * client is configured for PKCE, so it ignores a fragment entirely. The
   * cookie never appeared and every guarded page bounced to sign-in.
   *
   * `hashed_token` feeds the app's OWN confirm route, `/auth/confirm`, which is
   * what a real sign-up email link uses. It verifies server-side and sets the
   * session cookies the same way a genuine confirmation does. Using the
   * product's real arrival path is also simply a better test than inventing a
   * side door.
   */
  const hashed = body.properties?.hashed_token ?? body.hashed_token;

  if (!hashed) throw new Error(`no hashed_token in generate_link response: ${JSON.stringify(body)}`);

  return hashed;
}

const PACK = process.argv[2] || 'plus';
const HEADLESS = process.env.HEADED !== '1';

const EMAIL = 'stripe-e2e-buyer@un-claude.com';
const PASSWORD = 'StripeE2E-testing-2026!';

/**
 * Stripe's universal test card: always succeeds, never a real charge.
 *
 * Overridable so the dispute path can be exercised with 4000000000000259,
 * which succeeds and is then disputed as fraudulent — the most expensive
 * event this business has, at about $24.50 all in.
 */
const CARD = process.env.TEST_CARD || '4242424242424242';

const SHOTS = 'shots/stripe';
fs.mkdirSync(SHOTS, { recursive: true });

const log = (...a) => console.log(...a);
const step = (n, t) => log(`\n=== ${n} — ${t} ===`);

const browser = await chromium.launch({ channel: 'chrome', headless: HEADLESS });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + e.message));

let failed = false;
const fail = (msg) => { failed = true; log(`  !! ${msg}`); };

try {
  step(1, 'sign in as the throwaway buyer (admin-issued magic link)');

  const tokenHash = await adminMagicLink(EMAIL);
  log('  one-time token issued by the admin API');

  // The product's real email-confirmation arrival path.
  await page.goto(
    `http://localhost:3000/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=magiclink`,
    { waitUntil: 'domcontentloaded' },
  );
  await page.waitForTimeout(3000);
  log('  /auth/confirm landed on', page.url());

  const cookieSet = (await page.context().cookies()).some((c) => /^sb-.*-auth-token/.test(c.name));
  log('  supabase auth cookie present:', cookieSet);

  if (!cookieSet) throw new Error('no auth cookie after /auth/confirm — the session did not stick');

  await page.goto('http://localhost:3000/home', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  if (/auth\/sign-in/.test(page.url())) throw new Error('bounced to sign-in — not authenticated');

  log('  signed in, on', page.url());
  await page.screenshot({ path: `${SHOTS}/01-signed-in.png` });

  step(2, 'read the balance BEFORE buying');

  await page.waitForTimeout(2500); // grants + merge run on first balance call
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  const balanceBefore = await page.evaluate(() => {
    const el = [...document.querySelectorAll('p')].find((p) => /^\d+\s/.test(p.textContent.trim()) && /credit/.test(p.textContent));
    return el ? parseInt(el.textContent.trim(), 10) : null;
  });

  log('  balance before:', balanceBefore);
  if (balanceBefore === null) fail('could not read the balance from the wallet');
  await page.screenshot({ path: `${SHOTS}/02-wallet-before.png`, fullPage: true });

  step(3, `press Purchase now on the ${PACK} pack`);

  await page.goto('http://localhost:3000/pricing', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);

  const label = { starter: 'Starter', plus: 'Plus', pro: 'Pro' }[PACK];
  await page.click(`button[aria-label="Buy the ${label} pack"]`);

  // The button POSTs, then sends the browser to Stripe.
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 45_000 });
  log('  reached Stripe checkout:', page.url().slice(0, 60) + '…');
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${SHOTS}/03-stripe-checkout.png`, fullPage: true });

  step(4, 'what the buyer actually sees on the payment page');

  const shown = await page.evaluate(() => document.body.innerText);
  const interesting = shown
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 40);
  log('  ' + interesting.join('\n  '));

  step(5, 'pay with Stripe test card 4242 4242 4242 4242');

  /*
   * The Card form only appears once Card is SELECTED. This account has several
   * payment methods enabled (Card, Cash App Pay, Klarna, Amazon Pay, Bank), so
   * checkout opens on a chooser with no card fields rendered at all.
   */
  if (!(await page.$('#cardNumber'))) {
    // Only click when the accordion is actually closed. When it is already
    // open, its own expanded click-area overlays the button and intercepts the
    // click, which Playwright retries for 30s before giving up.
    const cardButton = await page.$('[data-testid="card-accordion-item-button"]');
    if (cardButton) {
      await cardButton.click().catch(() => {});
      await page.waitForTimeout(1500);
    }
    log('  opened the Card payment method');
  } else {
    log('  Card form already open');
  }

  await page.waitForSelector('#cardNumber', { timeout: 20_000 });
  await page.fill('#cardNumber', CARD);
  await page.fill('#cardExpiry', '12/34');
  await page.fill('#cardCvc', '123');

  // These two exist on some configurations and not others.
  const name = await page.$('#billingName');
  if (name) await page.fill('#billingName', 'Stripe E2E Buyer');

  const zip = await page.$('#billingPostalCode');
  if (zip) await page.fill('#billingPostalCode', '90278');

  // The terms-of-service consent checkbox, from consent_collection in the
  // checkout session. Its presence is itself part of what is being verified.
  /*
   * TWO checkboxes exist on this page and picking the wrong one silently skips
   * the consent. The FIRST is Link's "Save my information for faster checkout",
   * which is CHECKED BY DEFAULT. The one that matters is the terms-of-service
   * consent produced by consent_collection, found by its label text.
   */
  const consent = await page.$('input[type="checkbox"][name*="terms" i], label:has-text("Terms of Service") input[type="checkbox"]');
  const consentByText = consent ?? (await page.$('input[type="checkbox"] >> nth=-1'));

  if (consentByText) {
    const checked = await consentByText.isChecked();
    log('  terms-of-service consent checkbox present, checked =', checked);
    if (!checked) await consentByText.check();
  } else {
    fail('NO consent checkbox found — consent_collection did not take effect');
  }

  // Uncheck Link's "save my information", which is on by default and asks for a
  // phone number we do not want and did not request.
  const saveInfo = await page.$('input[type="checkbox"] >> nth=0');
  if (saveInfo && (await saveInfo.isChecked())) {
    await saveInfo.uncheck().catch(() => {});
    await page.waitForTimeout(800);
  }

  await page.screenshot({ path: `${SHOTS}/04-card-filled.png`, fullPage: true });

  await page.click('.SubmitButton, button[type="submit"]');

  step(6, 'follow the redirect back');

  await page.waitForURL(/localhost:3000\/home/, { timeout: 90_000 });
  log('  returned to', page.url());

  if (!page.url().includes('purchase=success')) {
    fail(`expected ?purchase=success in the return URL, got ${page.url()}`);
  }

  // The confirmation banner polls until the webhook lands.
  await page.waitForTimeout(6000);
  await page.screenshot({ path: `${SHOTS}/05-wallet-after.png`, fullPage: true });

  step(7, 'read the balance AFTER, and the banner');

  const after = await page.evaluate(() => {
    const el = [...document.querySelectorAll('p')].find((p) => /^\d+\s/.test(p.textContent.trim()) && /credit/.test(p.textContent));
    const banner = document.querySelector('[role="status"]');
    return {
      balance: el ? parseInt(el.textContent.trim(), 10) : null,
      banner: banner ? banner.innerText.trim() : null,
      history: [...document.querySelectorAll('li')].slice(0, 4).map((li) => li.innerText.replace(/\n/g, ' | ')),
    };
  });

  log('  balance after :', after.balance);
  log('  banner        :', after.banner);
  log('  history top   :');
  for (const h of after.history) log('      ' + h);

  const expected = { starter: 10, plus: 25, pro: 100 }[PACK];

  if (after.balance !== balanceBefore + expected) {
    fail(`expected ${balanceBefore} + ${expected} = ${balanceBefore + expected}, got ${after.balance}`);
  } else {
    log(`\n  OK: balance rose by exactly ${expected}.`);
  }

  if (consoleErrors.length) {
    log('\n  console errors during the run:');
    for (const e of consoleErrors.slice(0, 10)) log('    ' + e);
  } else {
    log('\n  no console errors.');
  }
} catch (err) {
  fail(`threw: ${err.message}`);
  await page.screenshot({ path: `${SHOTS}/99-failure.png`, fullPage: true }).catch(() => {});
  log('  url at failure:', page.url());
} finally {
  await browser.close();
}

log('\n' + '─'.repeat(60));
log(failed ? 'PURCHASE RUN FAILED' : 'PURCHASE RUN PASSED');
process.exit(failed ? 1 : 0);
