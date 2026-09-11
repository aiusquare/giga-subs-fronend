/**
 * Brand selector — resolved at build time via the VITE_BRAND env var.
 *
 * To add a new brand:
 *   1. Create  src/config/brands/mybrand.ts  following the same shape as gigadata.ts
 *   2. Import it below and add it to brandMap
 *   3. Set  VITE_BRAND=mybrand  in the deployment's .env file
 *   4. Run the build — the bundle will contain only the selected brand config
 */

import type { BrandConfig } from "./types";
import { gigadataBrand } from "./gigadata";

const brandMap: Record<string, BrandConfig> = {
  gigadata: gigadataBrand,
  // Add new brands here:
  // mybrand: mybrandBrand,
};

const brandId: string = (import.meta.env.VITE_BRAND as string) ?? "gigadata";

/**
 * The active brand config for this build.
 * Falls back to gigadata if VITE_BRAND is not set or unrecognised.
 */
export const brandConfig: BrandConfig = brandMap[brandId] ?? gigadataBrand;

export type { BrandConfig } from "./types";
