import {supabase} from './supabase-client';

export async function authFetch(
    url: string,
    options: RequestInit = {}
) : Promise<Response> {
    
    const {data: {session}} = await supabase.auth.getSession();

    const headers = new Headers(options.headers);

    if (session?.access_token) {
        headers.set("Authorization", `Bearer ${session.access_token}`);
    }

    if (!headers.has("Content-Type") && options.body) {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    // The access token may have expired while the app sat idle. Silently
    // refresh the session and retry the request once before surfacing the 401.
    if (response.status === 401) {
        const { data, error } = await supabase.auth.refreshSession();
        if (!error && data.session?.access_token) {
            const retryHeaders = new Headers(headers);
            retryHeaders.set(
                "Authorization",
                `Bearer ${data.session.access_token}`
            );
            return fetch(url, {
                ...options,
                headers: retryHeaders,
            });
        }
    }

    return response;
}