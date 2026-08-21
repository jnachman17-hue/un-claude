import { cn } from '@kit/ui/utils';

export function AuthLayoutShell({
  children,
  className,
  Logo,
  contentClassName,
}: React.PropsWithChildren<{
  Logo?: React.ComponentType;
  className?: string;
  contentClassName?: string;
}>) {
  return (
    <>
      <div
        className={cn(
          // TWO PHONE FIXES, 21 August 2026, both Jon's.
          //
          // `px-5` below `sm`: at 390px the form ran edge to edge and the
          // inputs touched both sides of the screen.
          //
          // `justify-start pt-24` below `sm`: the form was vertically centred
          // in a full-height screen, so on a phone it floated in the middle
          // with a quarter of a screen of nothing above it and more below.
          // Jon: "bring the create an account and everything that follows it
          // up to the top of the page instead of floating in the middle."
          // Centring is right on a desktop, where the form is a small object
          // in a wide field, and wrong on a phone, where it is the page.
          'animate-in fade-in slide-in-from-top-16 zoom-in-95 flex h-screen flex-col items-center justify-start gap-y-8 px-5 pt-24 duration-1000 sm:justify-center sm:px-0 sm:pt-0',
          className,
        )}
      >
        <div
          className={cn(
            'bg-background flex w-full max-w-[23rem] flex-col gap-y-4 md:w-8/12 lg:w-5/12 xl:w-4/12',
            contentClassName,
          )}
        >
          {children}
        </div>
      </div>

      {/*
        THE LOGO SITS TOP LEFT AT EVERY WIDTH NOW. Jon, 21 August 2026: "Then
        Un-Claude logo can be on top left."

        It was centred below `lg` and top left above it, which meant the mark
        moved when the screen changed size and, on a phone, sat directly over
        the middle of the form it was supposed to be above. Top left is also
        where it is on every other page of the site, so a visitor arriving
        from the tool sees it stay put.
      */}
      <div className="absolute top-6 left-5 flex lg:left-8">
        {Logo ? <Logo /> : null}
      </div>
    </>
  );
}
