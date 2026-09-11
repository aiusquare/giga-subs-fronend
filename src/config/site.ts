/**
 * Re-exports the active brand config as `siteConfig` for backward compatibility.
 * All brand values are now managed in src/config/brands/.
 * To change the brand, set VITE_BRAND in your .env file.
 */
export { brandConfig as siteConfig } from "./brands";
export type { BrandConfig as SiteConfig } from "./brands/types";
