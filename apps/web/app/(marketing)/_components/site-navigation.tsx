'use client';

import Link from 'next/link';

import { Menu } from 'lucide-react';

import { useUser } from '@kit/supabase/hooks/use-user';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import { NavigationMenu, NavigationMenuList } from '@kit/ui/navigation-menu';
import { Trans } from '@kit/ui/trans';

import pathsConfig from '~/config/paths.config';

import { SiteNavigationItem } from './site-navigation-item';

/**
 * The header navigation. Labels resolve through `marketing.json`. This row is
 * prime space and holds the four pages that sell; everything else lives in the
 * footer.
 */
const links: Record<
  string,
  {
    label: string;
    path: string;
  }
> = {
  HowItWorks: {
    label: 'marketing.howItWorks',
    path: '/how-it-works',
  },
  Capabilities: {
    label: 'marketing.capabilities',
    path: '/capabilities',
  },
  Mission: {
    label: 'marketing.mission',
    path: '/mission',
  },
  Pricing: {
    label: 'marketing.pricing',
    path: '/pricing',
  },
};

/**
 * The wallet link, ADDED 21 August 2026. `/home` is a signed-in visitor's
 * credit balance page and previously had no link anywhere in the site nav.
 *
 * Kept out of the static `links` map above and appended only for a signed-in,
 * non-anonymous user: the session is read on the client here, the same way
 * `SiteHeaderAccountSection` already does it, so a signed-out visitor's
 * request (and the cached marketing HTML) never differs. A signed-out
 * visitor must never see a link that just bounces them to sign-in.
 */
const walletLink = {
  label: 'marketing.wallet',
  path: pathsConfig.app.home,
};

export function SiteNavigation() {
  const { data: user } = useUser();
  const isSignedIn = Boolean(user) && user?.is_anonymous !== true;

  const allLinks = isSignedIn
    ? [...Object.values(links), walletLink]
    : Object.values(links);

  const NavItems = allLinks.map((item) => {
    return (
      <SiteNavigationItem key={item.path} path={item.path}>
        <Trans i18nKey={item.label} />
      </SiteNavigationItem>
    );
  });

  return (
    <>
      <div className={'hidden items-center justify-center md:flex'}>
        <NavigationMenu className={'px-4 py-2'}>
          <NavigationMenuList className={'space-x-5'}>
            {NavItems}
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      <div className={'flex justify-start sm:items-center md:hidden'}>
        <MobileDropdown links={allLinks} />
      </div>
    </>
  );
}

function MobileDropdown({
  links: items,
}: {
  links: Array<{ label: string; path: string }>;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={'Open Menu'}>
        <Menu className={'h-8 w-8'} />
      </DropdownMenuTrigger>

      <DropdownMenuContent className={'w-full'}>
        {items.map((item) => {
          const className = 'flex w-full h-full items-center';

          return (
            <DropdownMenuItem
              key={item.path}
              render={<Link className={className} href={item.path} />}
            >
              <Trans i18nKey={item.label} />
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
