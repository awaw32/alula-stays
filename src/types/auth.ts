export const USER_ROLES = ["admin", "owner", "member", "user"] as const;

export type UserRole = (typeof USER_ROLES)[number];

/** قائمة الإيميلات المصرح لها بالوصول إلى لوحة الإدارة حصراً */
export const AUTHORIZED_ADMIN_EMAILS = [
  "majed4v4@gmail.com",
  "koko4800pro@gmail.com",
] as const;

export function isAuthorizedAdmin(
  role: string | null | undefined,
  email?: string | null,
): boolean {
  if (role !== "admin") return false;
  if (!email) return false;
  return AUTHORIZED_ADMIN_EMAILS.includes(
    email.toLowerCase().trim() as (typeof AUTHORIZED_ADMIN_EMAILS)[number],
  );
}
