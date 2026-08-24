import { SiteFooter } from '~/(marketing)/_components/site-footer';
import { SiteHeader } from '~/(marketing)/_components/site-header';

/**
 * Synchronous on purpose. This layout used to await the session so the header
 * could render the signed-in state, which put user data into the server HTML of
 * every marketing page and forced them out of shared caches. The header now
 * reads the session on the client, so this response is identical for everyone.
 */
function SiteLayout(props: React.PropsWithChildren) {
  return (
    <div className={'flex min-h-[100vh] flex-col'}>
      {/*
        THE SKIP LINK, AND THE LANDMARK IT SKIPS TO. Added 23 August 2026.
        F1 audit, accessibility: ten live pages checked and not one had either.

        What it was like without them. Every visit, on every page, somebody
        using a screen reader or navigating by keyboard walked past the logo,
        four navigation links and two buttons before reaching anything they
        came for, with no way to jump — and on the home page the thing they
        came for is the first control below all of that.

        It is the first focusable thing in the document on purpose: a skip link
        that is not first is not a skip link. It is invisible until it is
        focused, which is the whole convention — a sighted mouse user never
        sees it, and the first press of Tab reveals it.
      */}
      <a
        href={'#main'}
        className={
          'sr-only focus:not-sr-only focus:bg-foreground focus:text-background focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-[9px] focus:px-4 focus:py-2 focus:text-[13px] focus:font-semibold'
        }
      >
        Skip to content
      </a>

      <SiteHeader />

      {/*
        `main` carries no classes and that is deliberate. Every page under this
        layout returns a plain block element with no sizing that depends on its
        parent, so an unstyled block wrapper around them changes no pixel of any
        of the nine. It is a landmark, not a layout.
      */}
      <main id={'main'}>{props.children}</main>

      <SiteFooter />
    </div>
  );
}

export default SiteLayout;
