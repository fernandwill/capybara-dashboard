import type { User } from "@supabase/supabase-js";

type SupabaseUserLike = Pick<User, "app_metadata"> | null | undefined;

function isNonEmptyString(value: string): value is string {
    return typeof value === "string" && value.length > 0;
}

export const ADMIN_ROLE = "admin";

export function getUserRole(user: SupabaseUserLike): string | null {
    // app_metadata carries an open index signature in the Supabase contract,
    // so role arrives untyped here and is verified below.
    const role = user?.app_metadata?.role;

    return isNonEmptyString(role) ? role : null;
}

export function isAdminUser(user: SupabaseUserLike): boolean {
    return getUserRole(user) === ADMIN_ROLE;
}
