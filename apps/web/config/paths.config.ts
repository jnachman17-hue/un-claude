import { z } from 'zod';

const PathsSchema = z.object({
  auth: z.object({
    signIn: z.string().min(1),
    signUp: z.string().min(1),
    verifyMfa: z.string().min(1),
    callback: z.string().min(1),
    passwordReset: z.string().min(1),
    passwordUpdate: z.string().min(1),
  }),
  app: z.object({
    home: z.string().min(1),
    profileSettings: z.string().min(1),
    afterAuth: z.string().min(1),
  }),
});

const pathsConfig = PathsSchema.parse({
  auth: {
    signIn: '/auth/sign-in',
    signUp: '/auth/sign-up',
    verifyMfa: '/auth/verify',
    callback: '/auth/callback',
    passwordReset: '/auth/password-reset',
    passwordUpdate: '/update-password',
  },
  app: {
    home: '/home',
    profileSettings: '/home/settings',
    /**
     * WHERE SIGNING IN PUTS YOU. Added 21 August 2026, session 10, from the
     * working position in 06 "Where sign-up should land you".
     *
     * The starter sends every authenticated arrival to `home`, its wallet
     * page. That is right for a dashboard product and wrong for this one.
     * Jon, on completing the first real sign-up in production: "now when you
     * sign up it brings you to this weird page instead of just back to the
     * home page." Nobody arrives at un-claude.com wanting to look at a
     * balance. They arrive wanting a document cleaned, and they only signed
     * up because the tool asked them to, so landing them on a ledger drops
     * them out of the job they were doing.
     *
     * `home` is unchanged and still the wallet: it stays in the account menu
     * and in the header's balance pill for anyone who wants the history.
     * This is only the destination the auth flows use.
     *
     * KEEP THIS A BARE PATH WITH NO QUERY STRING. `verifyTokenHash` in
     * packages/supabase assigns it straight to `url.pathname`, which would
     * encode a "?" into the path itself. The welcome parameter is appended by
     * the two route handlers in app/auth instead.
     */
    afterAuth: '/',
  },
} satisfies z.infer<typeof PathsSchema>);

export default pathsConfig;
