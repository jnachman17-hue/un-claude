'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { NavigationMenuItem } from '@kit/ui/navigation-menu';
import { cn, isRouteActive } from '@kit/ui/utils';

const getClassName = (path: string, currentPathName: string) => {
  const isActive = isRouteActive(path, currentPathName);

  /*
   * QUIETER THAN THE AUTH BUTTONS, 20 August 2026, Jon's note: the nav
   * links sat at full foreground weight right next to Sign In and Sign
   * Up, so the whole right side read as one undifferentiated group.
   *
   * Muted by default, full strength on hover and when the route is
   * active. Sign In and Sign Up keep their own button styling, so the
   * hierarchy is now obvious at a glance: links recede, actions lead.
   *
   * The dark: variants are gone with dark mode itself.
   */
  return cn(
    `inline-flex w-max text-[13.5px] font-medium transition-colors duration-200`,
    {
      'text-muted-foreground hover:text-foreground': !isActive,
      'text-foreground': isActive,
    },
  );
};

export function SiteNavigationItem({
  path,
  children,
}: React.PropsWithChildren<{
  path: string;
}>) {
  const currentPathName = usePathname();
  const className = getClassName(path, currentPathName);

  return (
    <NavigationMenuItem key={path}>
      <Link className={className} href={path}>
        {children}
      </Link>
    </NavigationMenuItem>
  );
}
