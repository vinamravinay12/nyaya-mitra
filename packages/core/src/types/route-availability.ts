import type { Route } from './route.js';

/**
 * A route paired with whether this user can actually take it.
 *
 * Unavailable routes are kept rather than filtered out: telling someone which
 * door is closed, and why, is as useful as listing the open ones.
 */
export type RouteAvailability =
  | { readonly route: Route; readonly available: true }
  | { readonly route: Route; readonly available: false; readonly reason: string };
