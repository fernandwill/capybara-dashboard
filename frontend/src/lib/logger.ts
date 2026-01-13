/**
 * Logger utility for consistent logging across the application.
 * - In development: logs to console
 * - In production: silences debug/info logs, keeps warn/error
 * 
 * Can be extended to integrate with external services like Sentry, LogRocket, etc.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDevelopment = process.env.NODE_ENV !== 'production';

interface LogMessage {
    level: LogLevel;
    message: string;
    data?: unknown;
    timestamp: string;
}

function formatMessage(level: LogLevel, message: string, data?: unknown): LogMessage {
    return {
        level,
        message,
        data,
        timestamp: new Date().toISOString(),
    };
}

/**
 * Debug level - only logs in development
 */
function debug(message: string, data?: unknown): void {
    if (!isDevelopment) return;
    const log = formatMessage('debug', message, data);
    console.log(`[DEBUG] ${log.timestamp}: ${log.message}`, data ?? '');
}

/**
 * Info level - only logs in development
 */
function info(message: string, data?: unknown): void {
    if (!isDevelopment) return;
    const log = formatMessage('info', message, data);
    console.info(`[INFO] ${log.timestamp}: ${log.message}`, data ?? '');
}

/**
 * Warn level - logs in both development and production
 */
function warn(message: string, data?: unknown): void {
    const log = formatMessage('warn', message, data);
    console.warn(`[WARN] ${log.timestamp}: ${log.message}`, data ?? '');
}

/**
 * Error level - logs in both development and production
 */
function error(message: string, data?: unknown): void {
    const log = formatMessage('error', message, data);
    console.error(`[ERROR] ${log.timestamp}: ${log.message}`, data ?? '');

    // TODO: Add external error tracking here
    // Example: Sentry.captureException(data);
}

export const logger = {
    debug,
    info,
    warn,
    error,
};
