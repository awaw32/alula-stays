export const USER_ROLES = ["admin", "owner", "member", "user"] as const;

export type UserRole = (typeof USER_ROLES)[number];
