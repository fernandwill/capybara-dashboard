type SupabaseUserLike = {
    app_metadata?: unknown;
} | null | undefined;

export const ADMIN_ROLE = "admin";

export function getUserRole(user: SupabaseUserLike): string | null {
    const appMetadata = user?.app_metadata;

    if (!appMetadata || typeof appMetadata !== "object") {
        return null;
    }

    const role = Reflect.get(appMetadata, "role");

    return typeof role === "string" && role.length > 0 ? role : null;
}

export function isAdminUser(user: SupabaseUserLike): boolean {
    return getUserRole(user) === ADMIN_ROLE;
}
