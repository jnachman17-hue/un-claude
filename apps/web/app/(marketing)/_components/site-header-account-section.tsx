'use client';

import { useEffect, useState } from 'react';

import dynamic from 'next/dynamic';
import Link from 'next/link';

import { PersonalAccountDropdown } from '@kit/accounts/personal-account-dropdown';
import { useSignOut } from '@kit/supabase/hooks/use-sign-out';
import { useUser } from '@kit/supabase/hooks/use-user';
import { Button } from '@kit/ui/button';
import { If } from '@kit/ui/if';
import { Trans } from '@kit/ui/trans';

import featuresFlagConfig from '~/config/feature-flags.config';
import pathsConfig from '~/config/paths.config';

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

  /*
   * AN ANONYMOUS SESSION IS NOT A SIGNED-IN PERSON. 04 entry 97: every
   * visitor who sanitises holds a guest account, so `user` exists for most
   * of the site's traffic. Showing them the account dropdown would present
   * an account they never created and cannot sign back into. Guests see the
   * ordinary Sign In / Sign Up buttons, which is also the ladder's next rung.
   */
  if (!user || user.is_anonymous === true) {
    return <AuthButtons />;
  }

  return (
    <div className={'flex items-center gap-2.5'}>
      <BalancePill />

      <PersonalAccountDropdown
        showProfileName={false}
        paths={paths}
        features={features}
        user={user}
        signOutRequested={() => signOut.mutateAsync()}
      />
    </div>
  );
}

/**
 * The balance, always one glance away for an account holder, linking to the
 * wallet. Renders nothing until the fetch answers, so the header never shows
 * a number it is not sure of.
 */
function BalancePill() {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    void fetch('/api/credits', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data: { balance: number | null }) => {
        if (typeof data.balance === 'number') setBalance(data.balance);
      })
      .catch(() => undefined);
  }, []);

  if (balance === null) return null;

  return (
    <Link
      href={paths.home}
      className={
        'bg-foreground/[0.05] text-foreground hover:bg-foreground/[0.09] rounded-full px-3 py-1.5 text-[12.5px] font-semibold tabular-nums transition-colors'
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
