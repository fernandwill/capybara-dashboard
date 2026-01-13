import {NextRequest, NextResponse} from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Unknown error.")
}

export async function getAuthenticatedUser(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization");
        const token = authHeader?.replace("Bearer ", "");

        if (!token) {
            return null;
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const {data: {user}, error} = await supabase.auth.getUser(token);

        if (error || !user) {
            return null;
        }

        return user;
    } catch (error) {
        console.error("Auth verification error: ", error);
        return null;
    }
}

export function unauthorizedResponse() {
    return NextResponse.json({error: "Unauthorized."}, {status: 401});
}