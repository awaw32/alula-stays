import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

/** جلب جميع المالكين (role = owner) */
export const getAllOwners = internalQuery({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("users").collect();
    return all.filter((u) => u.role === "owner");
  },
});

/** جلب شقق مالك معين */
export const getOwnerApartments = internalQuery({
  args: { ownerId: v.id("users") },
  handler: async (ctx, { ownerId }) => {
    return await ctx.db
      .query("apartments")
      .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
      .collect();
  },
});
