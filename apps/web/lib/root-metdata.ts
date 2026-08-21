import { Metadata } from 'next';

import appConfig from '~/config/app.config';

/**
 * @name generateRootMetadata
 * @description Generates the root metadata for the application
 *
 * Synchronous on purpose. This used to await headers() to read the
 * `x-csrf-token` set by the CSRF middleware, and because it belongs to the root
 * layout, that single read made every route in the app dynamic. The header is
 * no longer set, so the meta tag it fed goes with it.
 */
export const generateRootMetadata = (): Metadata => {
  return {
    title: appConfig.title,
    description: appConfig.description,
    metadataBase: new URL(appConfig.url),
    applicationName: appConfig.name,
    openGraph: {
      url: appConfig.url,
      siteName: appConfig.name,
      title: appConfig.title,
      description: appConfig.description,
    },
    twitter: {
      card: 'summary_large_image',
      title: appConfig.title,
      description: appConfig.description,
    },
    icons: {
      // The opposite of what the comment this replaced claimed: setting
      // `icons` at all turns OFF Next's file-convention auto-detection of
      // `app/icon.svg` — it does not merge with it. Every icon has to be
      // listed explicitly here once this field exists, or `app/icon.svg`
      // is built and served at /icon.svg but never linked from <head>,
      // which is exactly what shipped: shortcut and apple showed, `rel`
      // `icon` never did. `04` entry 99.
      icon: '/icon.svg',
      shortcut: '/images/favicon/favicon.ico',
      apple: '/images/favicon/apple-touch-icon.png',
      // Safari's pinned tab, and the same lesson one step further: the file
      // existed and was regenerated for Tile, but nothing linked it, so
      // Safari fell back to a screenshot of the page. `mask-icon` has no
      // first-class field, so it goes through `other`. The colour is the
      // accent Safari tints the mask with. `04` entry 100.
      other: [
        {
          rel: 'mask-icon',
          url: '/images/favicon/safari-pinned-tab.svg',
          color: '#c45e3d',
        },
      ],
    },
  };
};
