/**
 * سجل العمليات الإدارية — تسجيل كل إجراء حساس في activityLog
 * (قبول/رفض شقة، تغيير دور، إلغاء حجز، تعديل مستخدم، حذف محتوى...)
 */

import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

export type ActivityAction =
  | "apartment_approved"
  | "apartment_rejected"
  | "apartment_needs_changes"
  | "apartment_suspended"
  | "apartment_deleted"
  | "apartment_resubmitted"
  | "apartment_created"
  | "apartment_updated"
  | "apartment_featured"
  | "role_changed"
  | "user_disabled"
  | "user_enabled"
  | "booking_cancelled"
  | "booking_confirmed"
  | "payout_recorded"
  | "owner_bank_details_updated";

/**
 * تسجيل نشاط في activityLog — لا يُفشل الإجراء الأصلي إذا فشل التسجيل.
 */
export async function logActivity(
  ctx: MutationCtx,
  args: {
    actorId: Id<"users"> | null;
    action: ActivityAction;
    resourceType: string;
    resourceId?: string;
    details?: string;
  },
): Promise<void> {
  try {
    await ctx.db.insert("activityLog", {
      userId: args.actorId ?? undefined,
      action: args.action,
      resourceType: args.resourceType,
      resourceId: args.resourceId,
      details: args.details,
      timestamp: Date.now(),
    });
  } catch {
    // التسجيل لا يجب أن يعطّل الإجراء الأصلي
  }
}

/**
 * جلب سجل النشاط (للأدمن) — في ملف admin.ts كاستعلام.
 */
