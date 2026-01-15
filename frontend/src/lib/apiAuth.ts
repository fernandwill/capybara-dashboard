import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabaseServer";
import {logger} from "@/lib/logger";

export async function getAuthenticatedUser() {
    try {
        const supabase = await createClient();
        const {data: {user}, error} = await supabase.auth.getUser();

        if (error || !user) {
            return null;
        }

        return user;
    } catch (error) {
        logger.error("Auth verification error.", error);
        return null;
    }
}

export function unauthorizedResponse() {
    return NextResponse.json({error: "Unauthorized"}, {status: 401});
}