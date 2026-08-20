import {
  CheckIcon,
  EyeOffIcon,
  FileTextIcon,
  FingerprintIcon,
  ImageIcon,
  PaperclipIcon,
  TypeIcon,
} from 'lucide-react';

import { LiveCounter } from './live-counter';
import { Workbench } from './workbench/workbench';

/**
 * The hero, and it is the product rather than a picture of one.
 *
 * 04 entry 20: the landing page IS the tool. REBUILT 19 August 2026 under
 * entries 80 to 84 and the research in docs/09.
 *
 * THE HEADLINE CHANGED, and the old one broke Jon's own ruling. "Remove the
 * watermark Claude puts in your writing" is the exact claim entry 70 forbids:
 * for layer B nobody can say the watermark was removed, which is why the
 * product verb is "sanitise". The replacement is the line Jon ratified for the
 * statistical row, promoted to the top of the page: it asserts the visitor's
 * problem rather than our outcome, it is true of 100% of Claude output since
 * 2 August 2026, and it survives the day Anthropic's detector opens. It is
 * also five words, which matters on a phone.
 *
 * THE THREE STATISTICS ARE DEAD, replaced by the live counter. Jon's verdict
 * on the stats was that they made no sense on sight, and his fix was his own:
 * "maybe we scrap these and move the words cleaned with un-claude up into
 * that spot." The counter is the one number a stranger parses in under a
 * second, and it reads as evidence the product is used.
 *
 * MOBILE DROPS THE EXTRAS. 04 entry 84 ruling 3: most visitors convert on a
 * phone, the box must be on the first phone screen, and desktop-only material
 * simply disappears below lg the way GPTZero collapses its hero. On a phone
 * this section is: headline, one line, the tool. Nothing else.
 */
const HANDLES = [
  { icon: TypeIcon, label: 'Pasted text' },
  { icon: FileTextIcon, label: 'Word documents' },
  { icon: ImageIcon, label: 'PNG and JPG' },
];

export function HeroSection() {
  return (
    <section className={'relative overflow-hidden'}>
      {/* A last touch of warmth directly behind the tool. The page-level
          gradient in globals.css carries most of it. */}
      <div
        aria-hidden
        className={
          'pointer-events-none absolute top-[-18%] right-[-10%] h-[560px] w-[820px] rounded-full bg-[radial-gradient(closest-side,var(--mark),transparent)] opacity-[0.07] blur-[90px]'
        }
      />

      <div
        className={
          'relative mx-auto max-w-[1180px] px-5 pt-7 pb-14 sm:px-8 lg:pt-12'
        }
      >
        {/*
          THE TOOL COMES FIRST ON A PHONE. 06 row 75, hardened by 04 entry 84.
          Narrow: headline, BOX, then the desktop extras are simply absent.
          Wide: two columns, argument left, tool right, both above the fold.
        */}
        <div
          className={
            'flex flex-col gap-7 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 lg:gap-y-7'
          }
        >
          <div
            className={
              'animate-rise order-1 lg:col-span-5 lg:col-start-1 lg:row-start-1 lg:pt-6'
            }
          >
            <h1
              className={
                'text-foreground text-[34px] leading-[1.06] font-semibold tracking-[-0.03em] text-balance sm:text-[44px] lg:text-[54px] lg:leading-[1.04] lg:tracking-[-0.032em]'
              }
            >
              If Claude wrote it, it&rsquo;s marked.
            </h1>

            <p
              className={
                'text-muted-foreground mt-3.5 max-w-[42ch] text-[15px] leading-[1.55] tracking-[-0.006em] lg:mt-5 lg:text-[16px] lg:leading-[1.6]'
              }
            >
              We sanitise every kind of AI watermark in seconds.
            </p>

            {/*
              THE AUTHORITY STRIP. Jon's call, the GPTZero pattern: icons and
              hard claims, one glance, no reading. Written for someone who does
              not yet know what the three marks are: the icons plant that there
              are three, the middle claim carries the authority, the last one
              removes the risk of trying.
            */}
            {/* Stacked, not flowed: three flat lines read as a system;
                wrapped inline items read as two accidents. */}
            <ul className={'mt-5 space-y-2 lg:mt-6'}>
              <li
                className={
                  'text-foreground flex items-center gap-2 text-[13px] font-semibold tracking-[-0.01em]'
                }
              >
                <span className={'inline-flex shrink-0 items-center gap-1'}>
                  <EyeOffIcon
                    className={'text-mark-strong size-[14px]'}
                    strokeWidth={2}
                    aria-hidden
                  />
                  <PaperclipIcon
                    className={'text-mark-strong size-[14px]'}
                    strokeWidth={2}
                    aria-hidden
                  />
                  <FingerprintIcon
                    className={'text-mark-strong size-[14px]'}
                    strokeWidth={2}
                    aria-hidden
                  />
                </span>
                Every kind of watermark
              </li>
              <li
                className={
                  'text-foreground flex items-center gap-2 text-[13px] font-semibold tracking-[-0.01em]'
                }
              >
                <CheckIcon
                  className={'text-mark-strong size-[14px] shrink-0'}
                  strokeWidth={2.4}
                  aria-hidden
                />
                100% of detectable marks removed
              </li>
              <li
                className={
                  'text-foreground flex items-center gap-2 text-[13px] font-semibold tracking-[-0.01em]'
                }
              >
                <CheckIcon
                  className={'text-mark-strong size-[14px] shrink-0'}
                  strokeWidth={2.4}
                  aria-hidden
                />
                Free. No account needed.
              </li>
            </ul>
          </div>

          {/* Desktop-only validity block. Drops off entirely on a phone,
              where its pixels belong to the tool. 04 entry 84 ruling 3. */}
          <div
            className={
              'animate-rise order-3 hidden lg:order-none lg:col-span-5 lg:col-start-1 lg:row-start-2 lg:block'
            }
          >
            <div className={'max-w-[46ch]'}>
              <LiveCounter />
            </div>
          </div>

          <div
            className={
              'animate-rise order-2 lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1 lg:order-none'
            }
            style={{ animationDelay: '110ms' }}
          >
            <Workbench />

            <ul
              className={
                'mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 px-1'
              }
            >
              {HANDLES.map((handle) => (
                <li
                  key={handle.label}
                  className={
                    'text-muted-foreground inline-flex items-center gap-1.5 text-[12px]'
                  }
                >
                  <handle.icon
                    className={'size-[13px]'}
                    strokeWidth={1.9}
                    aria-hidden
                  />
                  {handle.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
