/* eslint-disable */
  /**
   * Generated `api` utility.
   *
   * THIS CODE IS AUTOMATICALLY GENERATED.
   *
   * To regenerate, run `npx convex dev`.
   * @module
   */
  
  import type { ApiFromModules, FilterApi, FunctionReference } from "convex/server";
  import type * as admin from "../admin.js";
import type * as apartments from "../apartments.js";
import type * as auth from "../auth.js";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as bookings from "../bookings.js";
import type * as favorites from "../favorites.js";
import type * as http from "../http.js";
import type * as lib_authorization from "../lib/authorization.js";
import type * as payments from "../payments.js";
import type * as reviews from "../reviews.js";
import type * as seed from "../seed.js";
import type * as seedReviews from "../seedReviews.js";
import type * as users from "../users.js";

  /**
   * A utility for referencing Convex functions in your app's API.
   *
   * Usage:
   * ```js
   * const myFunctionReference = api.myModule.myFunction;
   * ```
   */
  declare const fullApi: ApiFromModules<{
    "admin": typeof admin,
"apartments": typeof apartments,
"auth": typeof auth,
"auth/emailOtp": typeof auth_emailOtp,
"bookings": typeof bookings,
"favorites": typeof favorites,
"http": typeof http,
"lib/authorization": typeof lib_authorization,
"payments": typeof payments,
"reviews": typeof reviews,
"seed": typeof seed,
"seedReviews": typeof seedReviews,
"users": typeof users,
  }>;
  export declare const api: FilterApi<typeof fullApi, FunctionReference<any, "public">>;
  export declare const internal: FilterApi<typeof fullApi, FunctionReference<any, "internal">>;
  