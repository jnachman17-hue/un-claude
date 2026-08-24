import type { Metadata } from 'next';

import appConfig from '~/config/app.config';

/**
 * THE PREVIEW BUBBLE A PAGE GETS WHEN SOMEBODY SHARES IT.
 *
 * SHARE ANY OF THE NINE PAGES AND YOU GOT THE HOME PAGE. Measured on all nine
 * live pages by the F1 audit, finding G: the titles and the canonical links
 * were per-page and right, and the Open Graph tags were the root's every single
 * time. Send a friend the pricing link and the bubble in the chat reads
 * "Un-Claude · AI Watermark Remover" with the front-page blurb about scanning
 * for watermarks, and nothing about prices. The pricing page is the one people
 * share when they recommend a paid tool.
 *
 * WHY IT HAPPENED, because it is the same mistake this project already fixed
 * once. Next merges metadata shallowly: a page that sets `title` and
 * `description` and nothing else inherits the root's WHOLE `openGraph` object,
 * root url and all. That is exactly what standing rule D14 warns about for
 * canonical links — the root value leaking down onto every page — and the
 * canonical work got nine of nine right while this got nine of nine wrong.
 *
 * So the fields go here rather than being typed out nine times, because nine
 * copies of a thing that must agree is how the leak happens in the first place.
 * This is also Next's own documented remedy for its shallow merge: pull the
 * shared nested fields into one variable and spread it.
 *
 * THE IMAGE HAS TO BE NAMED HERE TOO, and finding that out cost a regression
 * caught in the same session. `app/opengraph-image.tsx` is a file convention
 * that Next attaches to every route BY WRITING INTO `openGraph.images` — so
 * the moment a page sets its own `openGraph`, the generated card goes with the
 * rest of the replaced object. Measured before it shipped: all nine pages had
 * correct titles and no `og:image` at all, including the home page, which had
 * one before. It is listed explicitly below.
 */
/**
 * The generated share card, at the path Next serves `app/opengraph-image.tsx`
 * from. Verified serving 200 and 56 KB of image/png.
 *
 * The file convention normally appends a content hash to this path as a cache
 * buster. Naming the path by hand loses that, so if the card's design is ever
 * changed, a preview already cached by a chat app may keep the old picture for
 * a while. That is the price of nine pages having their own titles, and it is
 * the smaller of the two problems.
 *
 * The alt text and the size restate what `app/opengraph-image.tsx` exports.
 * They are not imported from it because that file pulls in `next/og` to draw
 * the picture, and no page needs the renderer in order to link to it.
 */
const CARD = {
  url: '/opengraph-image',
  width: 1200,
  height: 630,
  alt: 'Un-Claude: if Claude wrote it, it is marked.',
};

export function shareTags(input: {
  /** The page's own bare title, exactly as its `title` field has it. */
  title: string;
  description: string;
  /** The path, for og:url. Resolved against `metadataBase`. */
  path: string;
}): Metadata {
  /*
   * Next applies the root's `%s · Un-Claude` template to the browser tab and
   * NOT to the share tags, so the full name is built here. The home page is
   * the one page whose title is already whole.
   */
  const title =
    input.path === '/' ? appConfig.title : `${input.title} · ${appConfig.name}`;

  return {
    openGraph: {
      type: 'website',
      siteName: appConfig.name,
      title,
      description: input.description,
      url: input.path,
      images: [CARD],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: input.description,
      images: [CARD],
    },
  };
}
