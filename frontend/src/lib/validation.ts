/**
 * Input validation utilities for API routes.
 * Provides schema-based validation with helpful error messages.
 */

import { NextResponse } from "next/server";

// Validation result type
interface ValidationResult<T> {
    success: boolean;
    data?: T;
    errors?: string[];
}

// Raw JSON values as received from request.json() at the API boundary.
type JsonValue =
    | string
    | number
    | boolean
    | null
    | JsonValue[]
    | { [key: string]: JsonValue };

type JsonObject = { [key: string]: JsonValue };

// Field validator types
type FieldValidator = (value: JsonValue | undefined, fieldName: string) => string | null;

function isString(value: JsonValue | undefined): value is string {
    return typeof value === "string";
}

function isNumber(value: JsonValue | undefined): value is number {
    return typeof value === "number";
}

// Common validators
const validators = {
    required: (value: JsonValue | undefined, fieldName: string): string | null => {
        if (value === undefined || value === null || value === "") {
            return `${fieldName} is required`;
        }
        return null;
    },

    string: (value: JsonValue | undefined, fieldName: string): string | null => {
        if (value !== undefined && value !== null && !isString(value)) {
            return `${fieldName} must be a string`;
        }
        return null;
    },

    number: (value: JsonValue | undefined, fieldName: string): string | null => {
        if (value !== undefined && value !== null && !isNumber(value)) {
            return `${fieldName} must be a number`;
        }
        return null;
    },

    email: (value: JsonValue | undefined, fieldName: string): string | null => {
        if (value !== undefined && value !== null && value !== "") {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!isString(value) || !emailRegex.test(value)) {
                return `${fieldName} must be a valid email address`;
            }
        }
        return null;
    },

    date: (value: JsonValue | undefined, fieldName: string): string | null => {
        if (value !== undefined && value !== null) {
            // ponytail: numeric timestamps were previously accepted; clients
            // only ever send ISO date strings.
            const date = isString(value) ? new Date(value) : null;
            if (!date || isNaN(date.getTime())) {
                return `${fieldName} must be a valid date`;
            }
        }
        return null;
    },

    timeRange: (value: JsonValue | undefined, fieldName: string): string | null => {
        if (value !== undefined && value !== null && value !== "") {
            if (!isString(value)) {
                return `${fieldName} must be a string`;
            }
            const timeRangeRegex = /^\d{2}:\d{2}-\d{2}:\d{2}$/;
            if (!timeRangeRegex.test(value)) {
                return `${fieldName} must be in format HH:MM-HH:MM`;
            }
        }
        return null;
    },

    positiveNumber: (value: JsonValue | undefined, fieldName: string): string | null => {
        if (value !== undefined && value !== null) {
            if (!isNumber(value) || value < 0) {
                return `${fieldName} must be a positive number`;
            }
        }
        return null;
    },

    enum:
        (allowedValues: string[]) =>
        (value: JsonValue | undefined, fieldName: string): string | null => {
            if (value !== undefined && value !== null && value !== "") {
                if (!isString(value) || !allowedValues.includes(value)) {
                    return `${fieldName} must be one of: ${allowedValues.join(", ")}`;
                }
            }
            return null;
        },

    minLength:
        (min: number) =>
        (value: JsonValue | undefined, fieldName: string): string | null => {
            if (value !== undefined && value !== null && isString(value)) {
                if (value.trim().length < min) {
                    return `${fieldName} must be at least ${min} characters`;
                }
            }
            return null;
        },

    array: (value: JsonValue | undefined, fieldName: string): string | null => {
        if (value !== undefined && value !== null && !Array.isArray(value)) {
            return `${fieldName} must be an array`;
        }
        return null;
    },
};

// Schema definition type
interface FieldSchema {
    validators: FieldValidator[];
}

type Schema = Record<string, FieldSchema>;

/**
 * Validates data against a schema
 */
function validate<T>(data: JsonObject, schema: Schema): ValidationResult<T> {
    const errors: string[] = [];

    for (const [fieldName, fieldSchema] of Object.entries(schema)) {
        const value = data[fieldName];

        for (const validator of fieldSchema.validators) {
            const error = validator(value, fieldName);
            if (error) {
                errors.push(error);
                break; // Only show first error per field
            }
        }
    }

    if (errors.length > 0) {
        return { success: false, errors };
    }

    // SAFETY: every field declared in the schema passed its validators above,
    // so data matches the contract T that callers derive from that schema.
    return { success: true, data: data as T };
}

/**
 * Returns a 400 Bad Request response with validation errors
 */
function validationErrorResponse(errors: string[]): NextResponse {
    return NextResponse.json(
        { error: "Validation failed", details: errors },
        { status: 400 }
    );
}

// Pre-defined schemas for common entities
const schemas = {
    createPlayer: {
        name: { validators: [validators.required, validators.string, validators.minLength(2)] },
        email: { validators: [validators.email] },
        phone: { validators: [validators.string] },
        notes: { validators: [validators.string] },
        status: { validators: [validators.enum(["ACTIVE", "INACTIVE"])] },
    } satisfies Schema,

    // Partial updates: every validator tolerates undefined, so a PUT with only
    // a subset of fields still validates what it receives.
    updatePlayer: {
        name: { validators: [validators.string, validators.minLength(2)] },
        email: { validators: [validators.email] },
        phone: { validators: [validators.string] },
        notes: { validators: [validators.string] },
        status: { validators: [validators.enum(["ACTIVE", "INACTIVE"])] },
    } satisfies Schema,

    createMatch: {
        title: { validators: [validators.required, validators.string, validators.minLength(3)] },
        location: { validators: [validators.required, validators.string] },
        courtNumber: { validators: [validators.string] },
        date: { validators: [validators.required, validators.date] },
        time: { validators: [validators.required, validators.timeRange] },
        fee: { validators: [validators.required, validators.positiveNumber] },
        status: { validators: [validators.enum(["UPCOMING", "COMPLETED"])] },
        description: { validators: [validators.string] },
        playerIds: { validators: [validators.array] },
    } satisfies Schema,
};

export { validate, validationErrorResponse, schemas };
