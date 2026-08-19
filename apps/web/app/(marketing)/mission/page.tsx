import { PageHeader } from '../_components/prose';

export const metadata = {
  title: 'Why we built this',
  description: 'Why un-claude exists.',
};

/**
 * Jon writes this page himself. 04 entry 40.
 *
 * Built, styled and routed so his words drop straight in. The placeholder below
 * is deliberately obvious rather than plausible filler: a mission page that
 * reads as though somebody meant it, written by a model, is the exact opposite
 * of what this page is for.
 */
function Mission() {
  return (
    <div className={'flex flex-col'}>
      <PageHeader
        title={'Why we built this.'}
        standfirst={
          'Jon is writing this page himself, in his own words. It will be here shortly.'
        }
      />

      <section className={'mx-auto w-full max-w-[1180px] px-5 py-16 sm:px-8'}>
        <div className={'border-border/70 max-w-[68ch] rounded-[16px] border border-dashed p-8'}>
          <p className={'text-muted-foreground text-[14px] leading-[1.7]'}>
            This page is intentionally empty. The rest of this site was written
            to explain how the product works and what it can prove. This one is
            about why it exists, and that is not something to hand to a machine.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Mission;
