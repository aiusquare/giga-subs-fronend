import type { BrandConfig } from "./types";

// ─── Brand palette ────────────────────────────────────────────────────────────
// Primary  : deep brand-blue  #1E1FD8  → HSL 237 75% 48%
// Accent   : brand-teal/cyan  #00B4C5  → HSL 186 100% 39%
// ─────────────────────────────────────────────────────────────────────────────

export const gigadataBrand: BrandConfig = {
  id: "gigadata",

  // Identity
  name: "Giga Data",
  tagline: "Fast & Reliable VTU Services",
  description:
    "Your trusted platform for airtime, data, cable TV, electricity bills, and more.",
  logo: "/brands/gigadata/logo.png",
  favicon: "/brands/gigadata/favicon.png",

  // Typography
  fontFamily: "Plus Jakarta Sans",
  fontUrl:
    "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",

  // Business
  business: {
    registeredName: "Giga Data Ltd.",
    location: "Katsina, Nigeria",
    address: "Faskari road, Funtua Katsina state, Nigeria",
    foundedYear: 2024,
  },

  // Contact
  contact: {
    email: "support@gigadata.com.ng",
    phone: "+234 800 000 0000",
    whatsapp: "+234 800 000 0000",
    website: "https://gigalinks.com.ng",
  },

  // Socials
  socials: {
    twitter: "https://twitter.com/gigalinks",
    facebook: "https://facebook.com/gigalinks",
    instagram: "https://instagram.com/gigalinks",
  },

  // Currency
  currency: {
    code: "NGN",
    symbol: "₦",
    locale: "en-NG",
  },

  // ── Light-mode colors (default) ────────────────────────────────────────────
  // All values: HSL without the hsl() wrapper
  colors: {
    primary: "237 75% 48%",
    primaryForeground: "0 0% 100%",
    background: "210 30% 98%",
    foreground: "237 45% 10%",
    card: "0 0% 100%",
    cardForeground: "237 45% 10%",
    popover: "0 0% 100%",
    popoverForeground: "237 45% 10%",
    secondary: "237 25% 92%",
    secondaryForeground: "237 45% 15%",
    muted: "237 20% 93%",
    mutedForeground: "237 15% 45%",
    accent: "186 75% 38%",
    accentForeground: "0 0% 100%",
    destructive: "0 84% 60%",
    destructiveForeground: "0 0% 100%",
    border: "237 15% 88%",
    input: "237 15% 88%",
    ring: "237 75% 48%",
    radius: "0.875rem",
    success: "142 70% 35%",
    successForeground: "0 0% 100%",
    warning: "38 92% 50%",
    warningForeground: "0 0% 0%",
    purple: "262 83% 58%",
    gradientPrimary:
      "linear-gradient(135deg, hsl(237 75% 48%) 0%, hsl(186 75% 38%) 100%)",
    gradientSecondary:
      "linear-gradient(135deg, hsl(237 25% 94%) 0%, hsl(237 20% 90%) 100%)",
    gradientCard:
      "linear-gradient(145deg, hsl(0 0% 100%) 0%, hsl(237 20% 97%) 100%)",
    gradientSuccess:
      "linear-gradient(135deg, hsl(142 70% 35%) 0%, hsl(142 65% 45%) 100%)",
    gradientWarning:
      "linear-gradient(135deg, hsl(38 92% 50%) 0%, hsl(45 93% 47%) 100%)",
    gradientPurple:
      "linear-gradient(135deg, hsl(262 83% 58%) 0%, hsl(280 87% 60%) 100%)",
    shadowGlow: "0 0 40px hsl(237 75% 48% / 0.14)",
    shadowCard: "0 4px 24px hsl(237 30% 60% / 0.12)",
    shadowElevated: "0 8px 32px hsl(237 40% 50% / 0.18)",
    sidebarBackground: "237 28% 96%",
    sidebarForeground: "237 45% 10%",
    sidebarPrimary: "237 75% 48%",
    sidebarPrimaryForeground: "0 0% 100%",
    sidebarAccent: "237 20% 90%",
    sidebarAccentForeground: "237 45% 15%",
    sidebarBorder: "237 15% 88%",
    sidebarRing: "237 75% 48%",
  },

  // ── Dark-mode overrides ────────────────────────────────────────────────────
  darkColors: {
    primary: "237 80% 62%",
    primaryForeground: "237 45% 7%",
    background: "237 45% 7%",
    foreground: "210 40% 96%",
    card: "237 42% 10%",
    cardForeground: "210 40% 96%",
    popover: "237 42% 10%",
    popoverForeground: "210 40% 96%",
    secondary: "237 35% 16%",
    secondaryForeground: "210 40% 96%",
    muted: "237 25% 20%",
    mutedForeground: "215 20% 55%",
    accent: "186 70% 46%",
    accentForeground: "237 45% 7%",
    destructive: "0 84% 60%",
    destructiveForeground: "210 40% 96%",
    border: "237 25% 20%",
    input: "237 25% 20%",
    ring: "237 80% 62%",
    radius: "0.875rem",
    success: "142 76% 36%",
    successForeground: "0 0% 100%",
    warning: "38 92% 50%",
    warningForeground: "0 0% 0%",
    purple: "262 83% 58%",
    gradientPrimary:
      "linear-gradient(135deg, hsl(237 80% 62%) 0%, hsl(186 70% 46%) 100%)",
    gradientSecondary:
      "linear-gradient(135deg, hsl(237 35% 14%) 0%, hsl(237 45% 9%) 100%)",
    gradientCard:
      "linear-gradient(145deg, hsl(237 35% 13%) 0%, hsl(237 45% 8%) 100%)",
    gradientSuccess:
      "linear-gradient(135deg, hsl(142 76% 36%) 0%, hsl(142 71% 45%) 100%)",
    gradientWarning:
      "linear-gradient(135deg, hsl(38 92% 50%) 0%, hsl(45 93% 47%) 100%)",
    gradientPurple:
      "linear-gradient(135deg, hsl(262 83% 58%) 0%, hsl(280 87% 60%) 100%)",
    shadowGlow: "0 0 40px hsl(237 80% 62% / 0.22)",
    shadowCard: "0 4px 24px hsl(237 45% 4% / 0.5)",
    shadowElevated: "0 8px 32px hsl(237 45% 4% / 0.7)",
    sidebarBackground: "237 45% 8%",
    sidebarForeground: "210 40% 96%",
    sidebarPrimary: "237 80% 62%",
    sidebarPrimaryForeground: "237 45% 7%",
    sidebarAccent: "237 35% 16%",
    sidebarAccentForeground: "210 40% 96%",
    sidebarBorder: "237 25% 20%",
    sidebarRing: "237 80% 62%",
  },

  // Settings
  settings: {
    defaultSessionTimeoutMinutes: 30,
    maxLoginAttempts: 5,
    requirePinForTransactions: true,
    lowBalanceThreshold: 1000,
  },

  // SEO
  seo: {
    titleTemplate: "%s | Giga Links",
    defaultTitle: "Giga Links - Fast & Reliable VTU Services",
    ogImage: "/brands/gigadata/og-image.png",
  },

  // Footer
  footer: {
    copyright: `© ${new Date().getFullYear()} Giga Links Ltd. All rights reserved.`,
    links: [
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "FAQ", href: "/faq" },
    ],
  },

  // ── Services / Feature flags ───────────────────────────────────────────────
  // Set any service to `false` to remove it completely from the app:
  // no route, no button, no card. Everything is opt-in per brand.
  services: {
    // Core VTU
    data: true,
    airtime: true,
    electricity: true,
    cable: true,
    bills: true,
    scratch_card: true,
    result_checker: true,

    // Identity verification
    bvn_verification: true,
    nin_verification: true,
    nin_slip_download: true,
    identity_update: true,

    // Platform features
    api_access: true,
    support_tickets: true,

    // More-page / coming-soon items
    gift_cards: false,
    virtual_cards: false,
    epins: false,
    insurance: false,
    fund_wallet: false,
    referrals: false,
    unified_identity: false,
  },
};
