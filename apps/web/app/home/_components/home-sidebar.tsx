import { Suspense } from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@kit/ui/sidebar';
import { SidebarNavigation } from '@kit/ui/sidebar-navigation';
import { Skeleton } from '@kit/ui/skeleton';

import { AppLogo } from '~/components/app-logo';
import { ProfileAccountDropdownContainer } from '~/components/personal-account-dropdown-container';
import { navigationConfig } from '~/config/navigation.config';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';

/**
 * The logo and the navigation do not depend on the user, so they prerender.
 * Only the account dropdown in the footer needs the session, so only that sits
 * behind a boundary. Taking the user as a prop here would push the await up
 * into the layout and make the whole sidebar, and everything under it, wait.
 */
export function HomeSidebar() {
  return (
    <Sidebar collapsible={'icon'}>
      <SidebarHeader className={'h-16 justify-center'}>
        <div className={'flex items-center justify-between space-x-2'}>
          {/* The wordmark is the entire logo (see app-logo.tsx) — there is no
              separate icon mark to fall back to. Every other sidebar label
              hides itself at icon width via this same class; the logo was
              missing it, so at icon width the full "Un-Claude" text kept
              rendering past the narrow rail and overlapped the page content
              next to it. Hiding it here leaves a blank collapsed header,
              which is correct: nothing is better than an overlap. */}
          <div className={'group-data-[collapsible=icon]:hidden'}>
            <AppLogo className={'max-w-full'} />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarNavigation config={navigationConfig} />
      </SidebarContent>

      <SidebarFooter>
        <Suspense fallback={<AccountDropdownFallback />}>
          <AccountDropdown />
        </Suspense>
      </SidebarFooter>
    </Sidebar>
  );
}

async function AccountDropdown() {
  const user = await requireUserInServerComponent();

  return <ProfileAccountDropdownContainer user={user} />;
}

function AccountDropdownFallback() {
  return (
    <div className={'flex items-center gap-x-2 p-2'}>
      <Skeleton className={'size-8 shrink-0 rounded-full'} />
      <Skeleton className={'h-4 w-full'} />
    </div>
  );
}
