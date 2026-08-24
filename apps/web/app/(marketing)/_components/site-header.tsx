import { Header } from '@kit/ui/marketing';

import { AppLogo } from '~/components/app-logo';

import { SiteHeaderAccountSection } from './site-header-account-section';
import { SiteNavigation } from './site-navigation';

/**
 * NAV MOVED OUT OF THE CENTRE, 20 August 2026, Jon's note.
 *
 * `Header` lays its three slots out on a 3-column grid, which forces
 * navigation into the middle column. Passing the nav inside `actions`
 * instead collapses that to two columns, so the links sit right-aligned
 * beside the auth buttons rather than centred in the bar.
 *
 * Done here rather than by editing `@kit/ui/marketing`'s Header, which is
 * shared component code: the grid behaviour it ships is fine, this page
 * just wants a different arrangement of the same slots.
 *
 * The gap between the two groups is deliberate and wide (gap-8): Jon's
 * ask was that the links not hug the sign-in button, so they read as
 * navigation rather than as more buttons.
 */
export function SiteHeader() {
  return (
    <Header
      logo={<AppLogo />}
      actions={
        /*
         * THE GAP IS DESKTOP-ONLY NOW, 23 August 2026, and that is half of 6e.
         * Jon's wide gap is between the LINKS and the account controls. Below
         * `md` the links are gone — the navigation collapses to a single
         * hamburger — so 32 pixels of separation were being spent next to
         * nothing, in the one place where the row has no width to spare, and
         * the credit pill beside it was the item that got squeezed onto two
         * lines. The desktop spacing Jon asked for is unchanged.
         */
        <div className={'flex min-w-0 items-center gap-3 md:gap-8'}>
          <SiteNavigation />
          <SiteHeaderAccountSection />
        </div>
      }
    />
  );
}
