import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Environment variables - validated at runtime, not at module load
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function getAuthenticatedUser(request: Request) {
    try {
        // Validate at runtime
        if (!supabaseUrl || !supabaseAnonKey) {
            console.error("Supabase environment variables not configured");
            return null;
        }

        const authHeader = request.headers.get("authorization");
        const token = authHeader?.replace("Bearer ", "");

        if (!token) {
            return null;
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const { data: { user }, error } = await supabase.auth.getUser(token);

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
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}