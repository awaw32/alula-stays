import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Role } from "../schema";
import { AuthorizationError, NotFoundError } from "./errors";

export type DatabaseCtx = QueryCtx | MutationCtx;

export async function requireUser(ctx: DatabaseCtx): Promise<Doc<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new AuthorizationError("يجب تسجيل الدخول أولاً");
  }

  const user = await ctx.db.get(userId);
  if (!user) {
    throw new NotFoundError("المستخدم");
  }

  // حساب معطّل من الأدمن — لا حجز ولا رفع ولا أي إجراء كتابة
  if (user.isDisabled) {
    throw new AuthorizationError(`تم تعطيل حسابك${user.disabledReason ? `: ${user.disabledReason}` : ""}. تواصل مع الدعم`);
  }

  return user;
}

/**
 * قائمة الإيميلات المصرح لها حصراً بصلاحيات الإدارة في المنصة
 */
export const AUTHORIZED_ADMIN_EMAILS = [
  "majed4v4@gmail.com",
  "koko4800pro@gmail.com",
] as const;

export function isAuthorizedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return (AUTHORIZED_ADMIN_EMAILS as readonly string[]).includes(email.toLowerCase().trim());
}

export async function requireRole(
  ctx: DatabaseCtx,
  role: Role,
): Promise<Doc<"users">> {
  const user = await requireUser(ctx);
  if (user.role !== role) {
    throw new AuthorizationError("غير مصرح لك بالوصول");
  }
  if (role === "admin" && !isAuthorizedAdminEmail(user.email)) {
    throw new AuthorizationError("غير مصرح لك بالوصول إلى لوحة الإدارة");
  }

  return user;
}

export async function requireAnyRole(
  ctx: DatabaseCtx,
  roles: readonly Role[],
): Promise<Doc<"users">> {
  const user = await requireUser(ctx);
  if (!user.role || !roles.includes(user.role)) {
    throw new AuthorizationError("غير مصرح لك بالوصول");
  }
  if (user.role === "admin" && !isAuthorizedAdminEmail(user.email)) {
    throw new AuthorizationError("غير مصرح لك بالوصول إلى لوحة الإدارة");
  }

  return user;
}

export async function requireApartmentOwner(
  ctx: DatabaseCtx,
  apartmentId: Id<"apartments">,
): Promise<{ user: Doc<"users">; apartment: Doc<"apartments"> }> {
  const user = await requireUser(ctx);
  const apartment = await ctx.db.get(apartmentId);

  if (!apartment) {
    throw new NotFoundError("الشقة");
  }

  const isAdmin = user.role === "admin";
  const isOwner = user.role === "owner" && apartment.ownerId === user._id;

  if (!isAdmin && !isOwner) {
    throw new AuthorizationError("ليس لديك صلاحية لهذه الشقة");
  }

  return { user, apartment };
}

export async function requireBookingAccess(
  ctx: DatabaseCtx,
  bookingId: Id<"bookings">,
): Promise<{ user: Doc<"users">; booking: Doc<"bookings"> }> {
  const user = await requireUser(ctx);
  const booking = await ctx.db.get(bookingId);

  if (!booking) {
    throw new NotFoundError("الحجز");
  }

  if (user.role === "admin" || booking.userId === user._id) {
    return { user, booking };
  }

  const apartment = await ctx.db.get(booking.apartmentId);
  if (user.role === "owner" && apartment?.ownerId === user._id) {
    return { user, booking };
  }

  throw new AuthorizationError("ليس لديك صلاحية لهذا الحجز");
}
