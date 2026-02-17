import type { DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

/**
 * @see https://authjs.dev/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User {
    id?: string;
    provider?: string;
    provider_account_id?: string;
    name?: string;
    email?: string;
    image?: string;
    role?: number;
  }
  /**
   * The shape of the account object returned in the OAuth providers' `account` callback,
   * Usually contains information about the provider being used, like OAuth tokens (`access_token`, etc).
   */
  interface Account {}

  /**
   * Returned by `useSession`, `auth`, contains information about the active session.
   */
  interface Session extends DefaultSession {
    user: User;
  }
}

/**
 * @see https://authjs.dev/getting-started/typescript#module-augmentation
 */
declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `auth`, when using JWT sessions */
  interface JWT extends DefaultJWT {
    id?: string;
    provider?: string;
    provider_account_id?: string;
    name?: string;
    email?: string;
    image?: string;
    role?: number;
  }
}
