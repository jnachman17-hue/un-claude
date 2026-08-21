import { z } from 'zod';

import { RefinedPasswordSchema } from './password.schema';

/**
 * NO REPEAT FIELD. Jon, 21 August 2026: "on sign up page remove Type your
 * password again below remove password box."
 *
 * The confirmation field is a convention from a time before password
 * managers and before "forgot your password" was one click. It costs a
 * measurable share of sign-ups on a consumer funnel, and this one is the
 * conversion step the whole product turns on. A typo is recoverable in
 * seconds through the reset link; an abandoned sign-up is not recoverable at
 * all. `refineRepeatPassword` stays in password.schema.ts because the
 * password RESET form still uses it, where there is no email to fall back on.
 */
export const PasswordSignUpSchema = z.object({
  email: z.string().email(),
  password: RefinedPasswordSchema,
});
