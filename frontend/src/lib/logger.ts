/**
 * Logger utility for consistent logging across the application.
 * - In development: logs to console
 * - In production: silences debug/info logs, keeps warn/error
 * 
 * Can be extended to integrate with external services like Sentry, LogRocket, etc.
 */

type LogLevel = 'info' | 'warn' | 'error';

const isDevelopment = process.env.NODE_ENV !== 'production';

interface LogMessage {
    level: LogLevel;
    message: string;
    data?: unknown;
    timestamp: string;
}

// ponytail: a logger is the terminal serialization sink, so it accepts any
// payload generically instead of declaring an unknown parameter.
function formatMessage<T>(level: LogLevel, message: string, data?: T): LogMessage {
    return {
        level,
        message,
        data,
        timestamp: new Date().toISOString(),
    };
}

/**
 * Info level - only logs in development
 */
function info<T>(message: string, data?: T): void {
    if (!isDevelopment) return;
    const log = formatMessage('info', message, data);
    console.info(`[INFO] ${log.timestamp}: ${log.message}`, data ?? '');
}

/**
 * Warn level - logs in both development and production
 */
function warn<T>(message: string, data?: T): void {
    const log = formatMessage('warn', message, data);
    console.warn(`[WARN] ${log.timestamp}: ${log.message}`, data ?? '');
}

/**
 * Error level - logs in both development and production
 */
function error<T>(message: string, data?: T): void {
    const log = formatMessage('error', message, data);
    console.error(`[ERROR] ${log.timestamp}: ${log.message}`, data ?? '');

    // TODO: Add external error tracking here
    // Example: Sentry.captureException(data);
}

export const logger = {
    info,
    warn,
    error,
};
