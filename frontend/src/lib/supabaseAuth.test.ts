import { describe, expect, it } from "vitest";
import { ADMIN_ROLE, getUserRole, isAdminUser } from "./supabaseAuth";

describe("getUserRole", () => {
    it("returns the role from app metadata", () => {
        expect(getUserRole({ app_metadata: { role: ADMIN_ROLE } })).toBe(ADMIN_ROLE);
    });

    it("returns null when role is missing", () => {
        expect(getUserRole({ app_metadata: {} })).toBeNull();
        expect(getUserRole(null)).toBeNull();
    });

    it("returns null for non-string role values", () => {
        expect(getUserRole({ app_metadata: { role: true } })).toBeNull();
    });
});

describe("isAdminUser", () => {
    it("returns true for admin users", () => {
        expect(isAdminUser({ app_metadata: { role: ADMIN_ROLE } })).toBe(true);
    });

    it("returns false for non-admin users", () => {
        expect(isAdminUser({ app_metadata: { role: "member" } })).toBe(false);
        expect(isAdminUser(undefined)).toBe(false);
    });
});
