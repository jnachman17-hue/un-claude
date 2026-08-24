'use client';

import { useEffect, useState } from 'react';

import dynamic from 'next/dynamic';
import Link from 'next/link';

import type { JwtPayload } from '@supabase/supabase-js';

import { PersonalAccountDropdown } from '@kit/accounts/personal-account-dropdown';
import { useSignOut } from '@kit/supabase/hooks/use-sign-out';
import { useUser } from '@kit/supabase/hooks/use-user';
import { Button } from '@kit/ui/button';
import { If } from '@kit/ui/if';
import { Trans } from '@kit/ui/trans';

import featuresFlagConfig from '~/config/feature-flags.config';
import pathsConfig from '~/config/paths.config';

import { devOverrides, refreshCredits, useCredits } from './workbench/credits';

const ModeToggle = dynamic(
  () =>
    import('@kit/ui/mode-toggle').then((mod) => ({
      default: mod.ModeToggle,
    })),
  {
    ssr: false,
  },
);

const paths = {
  home: pathsConfig.app.home,
};

const features = {
  enableThemeToggle: featuresFlagConfig.enableThemeToggle,
};

/**
 * The session is read on the client, never on the server. Reading it in the
 * marketing layout put user data into the server HTML, which is why those pages
 * had to be kept out of shared caches. The server response is now identical for
 * every visitor, so marketing pages are safe on any CDN.
 *
 * The trade-off is that a signed-in visitor briefly sees the signed-out actions
 * until the session resolves on the client.
 */
export function SiteHeaderAccountSection() {
  const signOut = useSignOut();
  const { data: user } = useUser();
  const preview = useAccountPreview();

  /*
   * AN ANONYMOUS SESSION IS NOT A SIGNED-IN PERSON. 04 entry 97: every
   * visitor who sanitises holds a guest account, so `user` exists for most
   * of the site's traffic. Showing them the account dropdown would present
   * an account they never created and cannot sign back into. Guests see the
   * ordinary Sign In / Sign Up buttons, which is also the ladder's next rung.
   */
  const shown = user && user.is_anonymous !== true ? user : preview;

  if (!shown) {
    return <AuthButtons />;
  }

  return (
    /*
     * `gap-8` ON THE ROW ABOVE THIS ONE IS WHY THE PILL BROKE IN HALF, and it
     * is worth writing down where the fix is not. Jon asked for a wide gap
     * between the LINKS and the account controls so the links read as
     * navigation. At phone width there are no links: the whole navigation is
     * one hamburger, and the wide gap is spending 32 pixels on nothing while
     * the pill beside it is squeezed onto two lines. The gap is narrowed on
     * small screens only, in site-header.tsx, and Jon's desktop spacing is
     * untouched.
     */
    <div className={'flex min-w-0 items-center gap-2.5'}>
      <BalancePill />

      <PersonalAccountDropdown
        showProfileName={false}
        paths={paths}
        features={features}
        user={shown}
        signOutRequested={() => signOut.mutateAsync()}
      />
    </div>
  );
}

/**
 * A SIGNED-IN HEADER THAT CAN BE LOOKED AT WITHOUT A LEDGER. Development only.
 *
 * This row is the first thing a paying customer sees and it had two open
 * defects in it, 6d and 6e, neither of which anyone could put on screen: the
 * whole thing is gated on a real, non-anonymous session, and there is no local
 * Supabase (06 row 11). Reproducing it meant signing in to the live database
 * and spending real credits, which is exactly the wall /dev/credits was built
 * to get over for the workbench. It now gets over it for the header too: pin a
 * balance ending in `:account` on /dev/credits and this row renders.
 *
 * The same two guards as every other switch in this product: the check below
 * is compiled out of a production build, and the stand-in identity is display
 * only. It buys nothing and it signs nothing in — every route still asks the
 * server who is calling.
 */
function useAccountPreview(): JwtPayload | null {
  const [forced, setForced] = useState<string | null>(null);

  useEffect(() => setForced(devOverrides().forced), []);

  if (process.env.NODE_ENV !== 'development') return null;
  if (!forced?.endsWith(':account')) return null;

  return { id: 'dev-preview', email: 'dev@un-claude.com' } as unknown as JwtPayload;
}

/**
 * The balance, always one glance away for an account holder, linking to the
 * wallet. Renders nothing until the fetch answers, so the header never shows
 * a number it is not sure of.
 *
 * IT USED TO SHOW A NUMBER IT WAS NOT SURE OF. LAUNCH-CHECKLIST 6d, and the
 * F1 audit finally photographed it: this component fetched /api/credits once
 * on mount into its own `useState` and never looked again, while the tool
 * fifty pixels below it showed the balance the sanitise had just returned.
 * Seven at the top of the page, six in the middle, at the same instant, both
 * about money, on a site taking money.
 *
 * There is one balance now and both read it through the store in
 * `workbench/credits.ts`. Nothing here polls: the workbench publishes the new
 * figure the moment the server hands it back, so the two agree in the same
 * frame as the spend.
 */
function BalancePill() {
  const { balance } = useCredits();

  useEffect(() => {
    void refreshCredits();

    /*
     * THE ONE CHANGE THIS PAGE CANNOT SEE HAPPEN: credits bought in the
     * Stripe tab. Coming back to the tab is the moment, and it is an event
     * rather than a timer, so an idle visitor costs nothing. `focus` alone
     * misses a tab switched back to without the window ever losing focus,
     * which is why both are listened for; `refreshCredits` shares one request
     * between them.
     */
    const recheck = () => {
      if (document.visibilityState === 'visible') void refreshCredits();
    };

    window.addEventListener('focus', recheck);
    document.addEventListener('visibilitychange', recheck);

    return () => {
      window.removeEventListener('focus', recheck);
      document.removeEventListener('visibilitychange', recheck);
    };
  }, []);

  if (balance === null) return null;

  return (
    <Link
      href={paths.home}
      className={
        /*
         * `whitespace-nowrap` IS THE WHOLE OF 6e. The pill sat in a flex row
         * beside the navigation and the avatar, and a flex child is allowed to
         * shrink below its content: at every width the audit photographed, the
         * number landed on one line and the word "credits" on the next, inside
         * a rounded pill sized for one line. The first thing a paying customer
         * sees, broken in half.
         *
         * `shrink-0` is the other half of it: without it the pill is still the
         * item the row chooses to squeeze when the navigation is wide.
         */
        'bg-foreground/[0.05] text-foreground hover:bg-foreground/[0.09] shrink-0 rounded-full px-3 py-1.5 text-[12.5px] font-semibold whitespace-nowrap tabular-nums transition-colors'
      }
    >
      {balance} {balance === 1 ? 'credit' : 'credits'}
    </Link>
  );
}

function AuthButtons() {
  return (
    <div className={'flex space-x-2'}>
      <div className={'hidden space-x-0.5 md:flex'}>
        <If condition={features.enableThemeToggle}>
          <ModeToggle />
        </If>

        <Button
          nativeButton={false}
          render={<Link href={pathsConfig.auth.signIn} />}
          variant={'ghost'}
        >
          <Trans i18nKey={'auth.signIn'} />
        </Button>
      </div>

      <Button
        nativeButton={false}
        render={<Link href={pathsConfig.auth.signUp} />}
        className="group"
        variant={'default'}
      >
        <Trans i18nKey={'auth.signUp'} />
      </Button>
    </div>
  );
}
