/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as journeyValidation from "../journeyValidation.js";
import type * as routeDataValidation from "../routeDataValidation.js";
import type * as seed from "../seed.js";
import type * as seedData from "../seedData.js";
import type * as seedImport from "../seedImport.js";
import type * as seedValidation from "../seedValidation.js";
import type * as validation from "../validation.js";
import type * as validators from "../validators.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  journeyValidation: typeof journeyValidation;
  routeDataValidation: typeof routeDataValidation;
  seed: typeof seed;
  seedData: typeof seedData;
  seedImport: typeof seedImport;
  seedValidation: typeof seedValidation;
  validation: typeof validation;
  validators: typeof validators;
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
