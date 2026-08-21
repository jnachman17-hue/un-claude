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
        <div className={'flex items-center gap-8'}>
          <SiteNavigation />
          <SiteHeaderAccountSection />
        </div>
      }
    />
  );
}
