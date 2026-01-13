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

// Field validator types
type FieldValidator = (value: unknown, fieldName: string) => string | null;

// Common validators
const validators = {
    required: (value: unknown, fieldName: string): string | null => {
        if (value === undefined || value === null || value === "") {
            return `${fieldName} is required`;
        }
        return null;
    },

    string: (value: unknown, fieldName: string): string | null => {
        if (value !== undefined && value !== null && typeof value !== "string") {
            return `${fieldName} must be a string`;
        }
        return null;
    },

    number: (value: unknown, fieldName: string): string | null => {
        if (value !== undefined && value !== null && typeof value !== "number") {
            return `${fieldName} must be a number`;
        }
        return null;
    },

    email: (value: unknown, fieldName: string): string | null => {
        if (value !== undefined && value !== null && value !== "") {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (typeof value !== "string" || !emailRegex.test(value)) {
                return `${fieldName} must be a valid email address`;
            }
        }
        return null;
    },

    date: (value: unknown, fieldName: string): string | null => {
        if (value !== undefined && value !== null) {
            const date = new Date(value as string);
            if (isNaN(date.getTime())) {
                return `${fieldName} must be a valid date`;
            }
        }
        return null;
    },

    timeRange: (value: unknown, fieldName: string): string | null => {
        if (value !== undefined && value !== null && value !== "") {
            if (typeof value !== "string") {
                return `${fieldName} must be a string`;
            }
            const timeRangeRegex = /^\d{2}:\d{2}-\d{2}:\d{2}$/;
            if (!timeRangeRegex.test(value)) {
                return `${fieldName} must be in format HH:MM-HH:MM`;
            }
        }
        return null;
    },

    positiveNumber: (value: unknown, fieldName: string): string | null => {
        if (value !== undefined && value !== null) {
            if (typeof value !== "number" || value < 0) {
                return `${fieldName} must be a positive number`;
            }
        }
        return null;
    },

    enum: (allowedValues: string[]) => (value: unknown, fieldName: string): string | null => {
        if (value !== undefined && value !== null && value !== "") {
            if (!allowedValues.includes(value as string)) {
                return `${fieldName} must be one of: ${allowedValues.join(", ")}`;
            }
        }
        return null;
    },

    minLength: (min: number) => (value: unknown, fieldName: string): string | null => {
        if (value !== undefined && value !== null && typeof value === "string") {
            if (value.trim().length < min) {
                return `${fieldName} must be at least ${min} characters`;
            }
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
function validate<T>(data: Record<string, unknown>, schema: Schema): ValidationResult<T> {
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
        status: { validators: [validators.enum(["ACTIVE", "INACTIVE"])] },
    } as Schema,

    createMatch: {
        title: { validators: [validators.required, validators.string, validators.minLength(3)] },
        location: { validators: [validators.required, validators.string] },
        courtNumber: { validators: [validators.string] },
        date: { validators: [validators.required, validators.date] },
        time: { validators: [validators.required, validators.timeRange] },
        fee: { validators: [validators.required, validators.positiveNumber] },
        status: { validators: [validators.enum(["UPCOMING", "COMPLETED"])] },
        description: { validators: [validators.string] },
    } as Schema,

    updateMatch: {
        title: { validators: [validators.string, validators.minLength(3)] },
        location: { validators: [validators.string] },
        courtNumber: { validators: [validators.string] },
        date: { validators: [validators.date] },
        time: { validators: [validators.timeRange] },
        fee: { validators: [validators.positiveNumber] },
        status: { validators: [validators.enum(["UPCOMING", "COMPLETED"])] },
        description: { validators: [validators.string] },
    } as Schema,

    updatePaymentStatus: {
        paymentStatus: { validators: [validators.required, validators.enum(["BELUM_SETOR", "SUDAH_SETOR"])] },
    } as Schema,
};

export { validate, validationErrorResponse, validators, schemas };
export type { ValidationResult, Schema };
