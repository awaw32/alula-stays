export const USER_ROLES = ["admin", "owner", "member", "user"] as const;

export type UserRole = (typeof USER_ROLES)[number];

/** قائمة الإيميلات المصرح لها بالوصول إلى لوحة الإدارة حصراً */
export const AUTHORIZED_ADMIN_EMAILS = [
  "majed4v4@gmail.com",
  "koko4800pro@gmail.com",
] as const;

/** نهايات أرقام الهواتف المصرح لها بصلاحيات الإدارة (عند الدخول برقم الجوال) */
export const AUTHORIZED_ADMIN_PHONE_SUFFIXES = [
  "506709265",
] as const;

export function isAuthorizedAdmin(
  role: string | null | undefined,
  email?: string | null,
  phone?: string | null,
): boolean {
  if (role !== "admin") return false;

  if (email) {
    const cleanEmail = email.toLowerCase().trim();
    if ((AUTHORIZED_ADMIN_EMAILS as readonly string[]).includes(cleanEmail)) {
      return true;
    }
  }

  if (phone) {
    const cleanDigits = phone.replace(/\D/g, "");
    if (AUTHORIZED_ADMIN_PHONE_SUFFIXES.some((s) => cleanDigits.endsWith(s))) {
      return true;
    }
  }

  return false;
}
