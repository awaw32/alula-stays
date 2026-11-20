/**
 * نظام رفع الصور والملفات
 * إدارة صور الشقق والمستندات
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * إنشاء URL لرفع الصورة (Signed Upload URL)
 * ⚠️ محمي: يتطلب تسجيل الدخول لمنع أي زائر من رفع ملفات عشوائية.
 */
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("يجب تسجيل الدخول أولاً");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * حفظ صورة الشقة — للمالك صاحب الشقة أو الأدمن فقط.
 */
export const saveApartmentImage = mutation({
  args: {
    apartmentId: v.id("apartments"),
    storageId: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    isPrimary: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("يجب تسجيل الدخول أولاً");
    }

    const apartment = await ctx.db.get(args.apartmentId);
    if (!apartment) {
      throw new Error("الشقة غير موجودة");
    }
    if (apartment.ownerId !== userId) {
      throw new Error("ليس لديك صلاحية لهذه الشقة");
    }

    const imageId = await ctx.db.insert("apartmentImages", {
      apartmentId: args.apartmentId,
      storageId: args.storageId,
      title: args.title || "صورة الشقة",
      description: args.description,
      isPrimary: args.isPrimary || false,
      uploadedAt: Date.now(),
    });

    return imageId;
  },
});

/**
 * الحصول على صور الشقة
 */
export const getApartmentImages = query({
  args: {
    apartmentId: v.id("apartments"),
  },
  handler: async (ctx, args) => {
    const images = await ctx.db
      .query("apartmentImages")
      .withIndex("by_apartment", (q) => q.eq("apartmentId", args.apartmentId))
      .order("desc")
      .collect();

    // جلب روابط الوصول للصور
    const imagesWithUrls = await Promise.all(
      images.map(async (image) => ({
        ...image,
        url: await ctx.storage.getUrl(image.storageId),
      }))
    );

    return imagesWithUrls;
  },
});

/**
 * تحديث الصورة الأساسية للشقة — للمالك أو الأدمن فقط.
 */
export const setPrimaryImage = mutation({
  args: {
    imageId: v.id("apartmentImages"),
    apartmentId: v.id("apartments"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("يجب تسجيل الدخول أولاً");
    }

    const apartment = await ctx.db.get(args.apartmentId);
    if (!apartment || apartment.ownerId !== userId) {
      throw new Error("ليس لديك صلاحية لهذه الشقة");
    }

    // إزالة الصورة الأساسية الحالية
    const images = await ctx.db
      .query("apartmentImages")
      .withIndex("by_apartment", (q) => q.eq("apartmentId", args.apartmentId))
      .collect();

    for (const img of images) {
      if (img.isPrimary) {
        await ctx.db.patch(img._id, { isPrimary: false });
      }
    }

    // تعيين الصورة الجديدة كأساسية
    await ctx.db.patch(args.imageId, { isPrimary: true });

    return "تم تحديث الصورة الأساسية";
  },
});

/**
 * حذف صورة — للمالك صاحب الشقة أو الأدمن فقط.
 */
export const deleteImage = mutation({
  args: {
    imageId: v.id("apartmentImages"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("يجب تسجيل الدخول أولاً");
    }

    const image = await ctx.db.get(args.imageId);

    if (!image) {
      throw new Error("الصورة غير موجودة");
    }

    const apartment = await ctx.db.get(image.apartmentId);
    if (!apartment || apartment.ownerId !== userId) {
      throw new Error("ليس لديك صلاحية لهذه الشقة");
    }

    // حذف الصورة من التخزين
    await ctx.storage.delete(image.storageId);

    // حذف السجل من قاعدة البيانات
    await ctx.db.delete(args.imageId);

    return "تم حذف الصورة";
  },
});

/**
 * صور ملف تعريف المستخدم — المستخدم يعدّل صورته هو فقط.
 */
export const saveUserProfileImage = mutation({
  args: {
    userId: v.id("users"),
    storageId: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("يجب تسجيل الدخول أولاً");
    }
    if (currentUserId !== args.userId) {
      throw new Error("لا يمكنك تعديل صورة مستخدم آخر");
    }

    // حقول صورة الملف الشخصي تعيش في جدول userProfiles (انظر schema.ts)
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (profile) {
      await ctx.db.patch(profile._id, {
        profileImageStorageId: args.storageId,
        profileImageUpdatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("userProfiles", {
        userId: args.userId,
        profileImageStorageId: args.storageId,
        profileImageUpdatedAt: Date.now(),
      });
    }

    return "تم تحديث صورة الملف الشخصي";
  },
});

/**
 * الحصول على صورة ملف تعريف المستخدم
 */
export const getUserProfileImage = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (!profile || !profile.profileImageStorageId) {
      return null;
    }

    const url = await ctx.storage.getUrl(profile.profileImageStorageId);
    return {
      url,
      updatedAt: profile.profileImageUpdatedAt,
    };
  },
});

/**
 * حذف صورة ملف التعريف — المستخدم يحذف صورته هو فقط.
 */
export const deleteProfileImage = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("يجب تسجيل الدخول أولاً");
    }
    if (currentUserId !== args.userId) {
      throw new Error("لا يمكنك تعديل صورة مستخدم آخر");
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (!profile || !profile.profileImageStorageId) {
      throw new Error("لا توجد صورة ملف شخصي");
    }

    // حذف من التخزين
    await ctx.storage.delete(profile.profileImageStorageId);

    // تحديث السجل
    await ctx.db.patch(profile._id, {
      profileImageStorageId: undefined,
    });

    return "تم حذف صورة الملف الشخصي";
  },
});

/**
 * احصائيات الصور
 */
export const getImageStats = query({
  args: {
    apartmentId: v.id("apartments"),
  },
  handler: async (ctx, args) => {
    const images = await ctx.db
      .query("apartmentImages")
      .withIndex("by_apartment", (q) => q.eq("apartmentId", args.apartmentId))
      .collect();

    const totalImages = images.length;
    const primaryImage = images.find((img) => img.isPrimary);

    return {
      totalCount: totalImages,
      hasPrimaryImage: !!primaryImage,
      primaryImageId: primaryImage?._id,
    };
  },
});
