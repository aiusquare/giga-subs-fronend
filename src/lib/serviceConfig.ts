/**
 * serviceConfig — compile-time service feature flags.
 *
 * Reads from `siteConfig.services` (set in src/config/brands/<brand>.ts).
 * A service that is `false` has NO route, NO nav entry, NO card — zero trace.
 *
 * Usage:
 *   import { isServiceEnabled } from "@/lib/serviceConfig";
 *   if (isServiceEnabled("data")) { ... }
 */

import { siteConfig } from "@/config/site";
import type { AppServices } from "@/config/brands/types";

/**
 * Returns true when the service is enabled in the brand config.
 * Unknown service keys default to `true` so future services are
 * visible until explicitly disabled.
 */
export function isServiceEnabled(serviceKey: keyof AppServices): boolean {
  const flag = siteConfig.services[serviceKey];
  return flag !== false;
}

/**
 * The full services map — use when you need to filter an array.
 */
export const enabledServices: AppServices = siteConfig.services;
