import pathsConfig from '~/config/paths.config';

/**
 * THE ARRIVAL FLAG. Added 21 August 2026, session 10.
 *
 * Signing up now lands on the tool rather than the wallet, which fixes the
 * thing Jon reported ("it brings you to this weird page instead of just back
 * to the home page") but loses the one thing the wallet did well: it showed
 * you, unmissably, that you now hold credits. So the arrival is marked, and
 * the tool shows the balance back with a line of confirmation.
 *
 * WHY A SEARCH PARAMETER AND NOT A SERVER FLAG. The obvious alternative is
 * for /api/credits to report whether it was the call that created the signup
 * grant. That is true exactly once, and more than one component on the page
 * calls it, so which of them learns the news is a race. A parameter set by
 * the route that performed the redirect is the same fact without the race.
 *
 * The parameter is only ever added to the site's own tool page. Anything
 * with a `next` of its own, such as a visitor who was sent to sign in from
 * the wallet, keeps its own destination untouched.
 */
const FLAG = 'welcome';

export function withWelcome(destination: string): string;
export function withWelcome(destination: URL): URL;
export function withWelcome(destination: string | URL): string | URL {
  if (destination instanceof URL) {
    if (destination.pathname !== pathsConfig.app.afterAuth) return destination;

    const marked = new URL(destination);
    marked.searchParams.set(FLAG, '1');

    return marked;
  }

  if (destination !== pathsConfig.app.afterAuth) return destination;

  return `${destination}?${FLAG}=1`;
}
