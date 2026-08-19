import { PageBody, PageHeader } from '@kit/ui/page';

// The humanizer that used to live here was scrapped with the rescope.
// 04 entry 21. The replacement is built by the site track and the engine it
// calls is at /api/scan and /api/clean. See apps/web/engine/API.md.
export default function HomePage() {
  return (
    <>
      <PageHeader description={'Your account'} />

      <PageBody>
        <p className={'text-muted-foreground text-sm'}>
          The tool lives on the public page. Signing in will show your credit
          balance and history here.
        </p>
      </PageBody>
    </>
  );
}
