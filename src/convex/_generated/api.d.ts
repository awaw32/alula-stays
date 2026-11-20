/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as analytics from "../analytics.js";
import type * as apartments from "../apartments.js";
import type * as auth from "../auth.js";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as auth_phoneOtp from "../auth/phoneOtp.js";
import type * as bookings from "../bookings.js";
import type * as calendar from "../calendar.js";
import type * as cronHelpers from "../cronHelpers.js";
import type * as cronQueries from "../cronQueries.js";
import type * as crons from "../crons.js";
import type * as email from "../email.js";
import type * as favorites from "../favorites.js";
import type * as features from "../features.js";
import type * as http from "../http.js";
import type * as identity from "../identity.js";
import type * as images from "../images.js";
import type * as infobip from "../infobip.js";
import type * as lib_activityLog from "../lib/activityLog.js";
import type * as lib_authorization from "../lib/authorization.js";
import type * as lib_env from "../lib/env.js";
import type * as lib_errors from "../lib/errors.js";
import type * as lib_money from "../lib/money.js";
import type * as lib_money_model from "../lib/money_model.js";
import type * as lib_rateLimiting from "../lib/rateLimiting.js";
import type * as lib_validation from "../lib/validation.js";
import type * as messages from "../messages.js";
import type * as notifications from "../notifications.js";
import type * as owners from "../owners.js";
import type * as payments from "../payments.js";
import type * as payouts from "../payouts.js";
import type * as reports from "../reports.js";
import type * as reviews from "../reviews.js";
import type * as seed from "../seed.js";
import type * as seedReviews from "../seedReviews.js";
import type * as settings from "../settings.js";
import type * as telegram from "../telegram.js";
import type * as telegramDb from "../telegramDb.js";
import type * as users from "../users.js";
import type * as whatsapp from "../whatsapp.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  analytics: typeof analytics;
  apartments: typeof apartments;
  auth: typeof auth;
  "auth/emailOtp": typeof auth_emailOtp;
  "auth/phoneOtp": typeof auth_phoneOtp;
  bookings: typeof bookings;
  calendar: typeof calendar;
  cronHelpers: typeof cronHelpers;
  cronQueries: typeof cronQueries;
  crons: typeof crons;
  email: typeof email;
  favorites: typeof favorites;
  features: typeof features;
  http: typeof http;
  identity: typeof identity;
  images: typeof images;
  infobip: typeof infobip;
  "lib/activityLog": typeof lib_activityLog;
  "lib/authorization": typeof lib_authorization;
  "lib/env": typeof lib_env;
  "lib/errors": typeof lib_errors;
  "lib/money": typeof lib_money;
  "lib/money_model": typeof lib_money_model;
  "lib/rateLimiting": typeof lib_rateLimiting;
  "lib/validation": typeof lib_validation;
  messages: typeof messages;
  notifications: typeof notifications;
  owners: typeof owners;
  payments: typeof payments;
  payouts: typeof payouts;
  reports: typeof reports;
  reviews: typeof reviews;
  seed: typeof seed;
  seedReviews: typeof seedReviews;
  settings: typeof settings;
  telegram: typeof telegram;
  telegramDb: typeof telegramDb;
  users: typeof users;
  whatsapp: typeof whatsapp;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
