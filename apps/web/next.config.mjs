import createNextIntlPlugin from 'next-intl/plugin';

// Create the next-intl plugin with the request config path
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ENABLE_REACT_COMPILER = process.env.ENABLE_REACT_COMPILER === 'true';

const INTERNAL_PACKAGES = [
  '@kit/ui',
  '@kit/auth',
  '@kit/accounts',
  '@kit/shared',
  '@kit/supabase',
  '@kit/i18n',
  '@kit/next',
];

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  /**
   * PHONE TESTING OVER THE LOCAL NETWORK. Added 21 August 2026.
   *
   * Next.js 16 refuses to serve its dev resources to any origin other than
   * localhost. Open the dev server from a phone at http://<mac-ip>:3000 and
   * the HTML arrives fine while EVERY JavaScript chunk is blocked, so the page
   * renders and nothing on it works: no Scan it, no Try an example, no menu.
   *
   * That failure is indistinguishable from a broken build unless you read
   * apps/web/.next/dev/logs/next-development.log, where it says so 146 times.
   * Jon hit it on his own phone before this line existed.
   *
   * DEVELOPMENT ONLY, and it has no production equivalent: a deployed build
   * serves its assets normally and this key is ignored. The wildcard covers a
   * whole private subnet, so a new DHCP lease does not silently break phone
   * testing again. Nothing outside a local network can reach the dev server
   * in the first place.
   */
  allowedDevOrigins: ['192.168.*.*', '10.*.*.*', '172.16.*.*', '*.local'],
  /** Enables hot reloading for local packages without a build step */
  transpilePackages: INTERNAL_PACKAGES,
  images: {
    remotePatterns: getRemotePatterns(),
    /**
     * Supabase Storage runs on 127.0.0.1 locally, and Next.js 16 blocks
     * optimizing local IPs by default. Only relax this outside production.
     */
    dangerouslyAllowLocalIP: !IS_PRODUCTION,
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  serverExternalPackages: [],
  // needed for supporting dynamic imports for local content
  outputFileTracingIncludes: {
    '/*': ['./content/**/*'],
  },
  /**
   * Partial Prerendering. Every route ships a static shell that serves
   * immediately, and anything behind a Suspense boundary streams in per
   * request. The kit ships zero `export const instant = false` opt-outs.
   */
  cacheComponents: true,
  /** Builds one App Shell per route and reuses it for every link to it. */
  partialPrefetching: true,
  reactCompiler: ENABLE_REACT_COMPILER,
  turbopack: {
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  experimental: {
    mdxRs: true,
    /** TypeScript 7 does not expose the compiler API Next.js uses, so drive it
     * through the TS CLI instead. */
    useTypeScriptCli: true,
    optimizePackageImports: [
      'recharts',
      'lucide-react',
      '@base-ui/react',
      'date-fns',
      ...INTERNAL_PACKAGES,
    ],
  },
  modularizeImports: {
    lodash: {
      transform: 'lodash/{{member}}',
    },
  },
  /** We already do typechecking as a separate task in CI. Next.js 16 removed
   * the `eslint` option along with `next lint`; linting runs via the ESLint CLI. */
  typescript: { ignoreBuildErrors: true },
  /**
   * BROWSER SECURITY HEADERS. Added 23 August 2026, session 12, Lane E S-2.
   *
   * The live site returned exactly one of the six standard ones —
   * `strict-transport-security`, which Vercel adds itself. The other five were
   * absent everywhere, including on `/auth/sign-in`, the page where people
   * type a password. These four are added here. `content-security-policy` is
   * NOT, deliberately, and the reason is at the bottom of this comment.
   *
   * What each one does, in the order they appear below.
   *
   * `X-Frame-Options: DENY` stops any other website loading a page of this
   * site inside a frame. That is the one that matters on the sign-in page:
   * without it another site can put an invisible copy of it on top of its own,
   * so a visitor thinks they are clicking one thing and are really typing a
   * password into another. DENY rather than SAMEORIGIN because this app frames
   * none of its own pages — there is not one `<iframe>` in the codebase, so
   * there is nothing to break by refusing all framing.
   *
   * `X-Content-Type-Options: nosniff` stops a browser guessing that a file is
   * something other than what the server said it was, which is how an upload
   * can be talked into running as a script.
   *
   * `Referrer-Policy: strict-origin-when-cross-origin` means that when a
   * visitor leaves this site, the other site is told they came from
   * `un-claude.com` and not which page they were on. On a product people use
   * for documents they would rather not discuss, the page address is worth
   * keeping. This is already the browser default; stating it means the site
   * keeps the behaviour if a browser's default ever loosens.
   *
   * `Permissions-Policy` switches off browser features this site does not use,
   * so nothing on a page can ask for them. Camera, microphone and location are
   * never used here. `payment` is off too: checkout is a redirect to Stripe's
   * own hosted page on Stripe's own domain, so nothing on this domain ever
   * needs the payment API. Session replay is off in the analytics config, so
   * nothing legitimate wants the camera or the microphone either.
   *
   * WHY NO CONTENT-SECURITY-POLICY HERE, AND WHAT IT WOULD TAKE.
   *
   * CSP is the rule that says which scripts a page is allowed to run. This
   * site serves the PostHog analytics snippet as an INLINE script, which is
   * the exact thing a strict CSP blocks, so a careless one silently kills
   * analytics. The correct fix is a nonce — a fresh random token minted per
   * request, put on both the header and the script tag — and a nonce cannot be
   * set from this file, because this file's headers are fixed at build time.
   * It would have to be minted per request in `proxy.ts`, and doing that turns
   * off the static shell that `cacheComponents: true` above gives every route,
   * because a page containing a per-request token cannot be prerendered. That
   * is a change to how every page on the site is rendered, not a header.
   *
   * AND IT CANNOT BE VERIFIED LOCALLY. `NEXT_PUBLIC_POSTHOG_KEY` is empty in
   * the local env, so `AnalyticsProvider` returns null and the inline script
   * that a CSP would break never renders on a development machine. Proving a
   * CSP safe therefore needs a deployment, and this session is not permitted
   * to deploy. Shipping one unverified is how analytics dies quietly.
   *
   * So: four headers landed and proved, CSP written up as its own item. None
   * of the four below can affect whether a script runs, which is why they are
   * safe to ship without the deployment that CSP needs.
   */
  async headers() {
    return [
      /**
       * THE ICON THE LOG WAS DROWNING IN. Lane E item S-4.
       *
       * The file now answers, but a 200 asked for on every page load is still
       * a line in the log. A week of cache is what turns "97 of every 100 log
       * lines" into a handful: the browser stops asking. A week rather than a
       * year because an icon that can never be changed for twelve months is
       * its own problem, and `stale-while-revalidate` means a change is picked
       * up in the background rather than making anybody wait for it.
       */
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
        ],
      },
    ];
  },
};

export default withNextIntl(config);

function getRemotePatterns() {
  /** @type {import('next').NextConfig['remotePatterns']} */
  const remotePatterns = [];

  if (SUPABASE_URL) {
    const hostname = new URL(SUPABASE_URL).hostname;

    remotePatterns.push({
      protocol: 'https',
      hostname,
    });
  }

  return IS_PRODUCTION
    ? remotePatterns
    : [
        {
          protocol: 'http',
          hostname: '127.0.0.1',
        },
        {
          protocol: 'http',
          hostname: 'localhost',
        },
      ];
}
