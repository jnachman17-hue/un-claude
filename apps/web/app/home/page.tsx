import { PageBody, PageHeader } from '@kit/ui/page';

import { Humanizer } from '~/home/_components/humanizer';

export default function HomePage() {
  return (
    <>
      <PageHeader
        description={'Paste a draft and rewrite it to read naturally'}
      />

      <PageBody>
        <Humanizer />
      </PageBody>
    </>
  );
}
