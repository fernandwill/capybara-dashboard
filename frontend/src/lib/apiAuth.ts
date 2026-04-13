import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabaseServer";
import { getUserRole, isAdminUser } from "@/lib/supabaseAuth";
import { logger } from "@/lib/logger";

type AdminAuthResult =
    | { ok: true; user: User }
    | { ok: false; response: NextResponse };

export async function requireAdminUser(): Promise<AdminAuthResult> {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser();

        if (error || !user) {
            return { ok: false, response: unauthorizedResponse() };
        }

        if (!isAdminUser(user)) {
            logger.warn("Forbidden admin API access attempt.", {
                email: user.email ?? null,
                role: getUserRole(user),
                userId: user.id,
            });
            return { ok: false, response: forbiddenResponse() };
        }

        return { ok: true, user };
    } catch (error) {
        logger.error("Auth verification error.", error);
        return { ok: false, response: unauthorizedResponse() };
    }
}

export function unauthorizedResponse() {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbiddenResponse() {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
