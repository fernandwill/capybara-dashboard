/**
 * Centralized API error handling utilities.
 * Provides consistent error responses and logging across all API routes.
 */

import { NextResponse } from "next/server";
import { logger } from "./logger";

interface ApiErrorOptions {
    /** Error message for the client (user-facing) */
    clientMessage: string;
    /** HTTP status code */
    status?: number;
    /** Internal logging context */
    context?: string;
}

/**
 * Handles API errors consistently.
 * - Logs the error with context using the logger
 * - Returns a consistent JSON error response
 */
export function handleApiError(
    error: unknown,
    options: ApiErrorOptions
): NextResponse {
    const { clientMessage, status = 500, context } = options;

    // Log the error with context
    const logMessage = context ? `${context}: ${clientMessage}` : clientMessage;
    logger.error(logMessage, error);

    // Return consistent error response
    return NextResponse.json(
        { error: clientMessage },
        { status }
    );
}

/**
 * Common error responses
 */
export const ApiErrors = {
    notFound: (resource: string) => ({
        clientMessage: `${resource} not found.`,
        status: 404,
    }),

    badRequest: (message: string) => ({
        clientMessage: message,
        status: 400,
    }),

    conflict: (message: string) => ({
        clientMessage: message,
        status: 409,
    }),

    serverError: (action: string) => ({
        clientMessage: `Failed to ${action}.`,
        status: 500,
    }),
};
