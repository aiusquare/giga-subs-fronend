export interface BrandColors {
  /**
   * All color tokens are HSL values WITHOUT the hsl() wrapper.
   * e.g. "174 72% 50%"  →  used as  hsl(var(--primary))  in Tailwind
   */

  // Core palette
  primary: string;
  primaryForeground: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;

  /** CSS length value, e.g. "1rem" */
  radius: string;

  // Semantic
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;

  /** Used for purple service-category cards */
  purple: string;

  // Gradients — full CSS gradient strings
  gradientPrimary: string;
  gradientSecondary: string;
  gradientCard: string;
  gradientSuccess: string;
  gradientWarning: string;
  gradientPurple: string;

  // Shadows
  shadowGlow: string;
  shadowCard: string;
  shadowElevated: string;

  // Sidebar
  sidebarBackground: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
}

export interface BrandConfig {
  /** Unique slug — must match the VITE_BRAND env var value */
  id: string;

  // Identity
  name: string;
  tagline: string;
  description: string;

  /** Path to main logo relative to /public, e.g. "/brands/gigadata/logo.svg" */
  logo: string;
  /** Path to favicon relative to /public, e.g. "/brands/gigadata/favicon.ico" */
  favicon: string;

  // Typography
  /** Font family name as used in CSS, e.g. "Plus Jakarta Sans" */
  fontFamily: string;
  /** Full Google Fonts stylesheet URL for this font */
  fontUrl: string;

  // Business
  business: {
    registeredName: string;
    location: string;
    address: string;
    foundedYear: number;
  };

  // Contact
  contact: {
    email: string;
    phone: string;
    whatsapp: string;
    website: string;
  };

  // Social links
  socials: {
    twitter: string;
    facebook: string;
    instagram: string;
  };

  // Currency & locale
  currency: {
    code: string;
    symbol: string;
    locale: string;
  };

  // Theme
  /** Light-mode (default) colors */
  colors: BrandColors;
  /** Dark-mode overrides — any tokens not listed fall back to `colors` */
  darkColors?: Partial<BrandColors>;

  // App behaviour
  settings: {
    defaultSessionTimeoutMinutes: number;
    maxLoginAttempts: number;
    requirePinForTransactions: boolean;
    lowBalanceThreshold: number;
  };

  // SEO
  seo: {
    titleTemplate: string;
    defaultTitle: string;
    ogImage: string;
  };

  // Footer
  footer: {
    copyright: string;
    links: Array<{ label: string; href: string }>;
  };

  /**
   * Feature flags — set a service to `false` to remove it completely from
   * the app: no route, no nav button, no card. Missing keys default to true.
   *
   * Change these in src/config/brands/<your-brand>.ts to match the services
   * you want active for this deployment. No code changes elsewhere needed.
   */
  services: AppServices;
}

/**
 * All toggleable services / features in the app.
 * Add new services here; set them in the brand config.
 */
export interface AppServices {
  // ── Core VTU ──────────────────────────────────────────────────────────────
  data: boolean;
  airtime: boolean;
  electricity: boolean;
  cable: boolean;
  bills: boolean;
  scratch_card: boolean;
  result_checker: boolean;

  // ── Identity verification ─────────────────────────────────────────────────
  bvn_verification: boolean;
  nin_verification: boolean;
  nin_slip_download: boolean;
  identity_update: boolean;

  // ── Platform features ─────────────────────────────────────────────────────
  api_access: boolean;
  support_tickets: boolean;

  // ── More-page / coming-soon items ─────────────────────────────────────────
  gift_cards: boolean;
  virtual_cards: boolean;
  epins: boolean;
  insurance: boolean;
  fund_wallet: boolean;
  referrals: boolean;
  unified_identity: boolean;
}
