import type { BrandConfig, BrandColors } from "../config/brands/types";

/**
 * Maps a BrandColors object to a flat CSS-variable record.
 */
function colorsToVars(c: BrandColors): Record<string, string> {
  return {
    "--background": c.background,
    "--foreground": c.foreground,
    "--card": c.card,
    "--card-foreground": c.cardForeground,
    "--popover": c.popover,
    "--popover-foreground": c.popoverForeground,
    "--primary": c.primary,
    "--primary-foreground": c.primaryForeground,
    "--secondary": c.secondary,
    "--secondary-foreground": c.secondaryForeground,
    "--muted": c.muted,
    "--muted-foreground": c.mutedForeground,
    "--accent": c.accent,
    "--accent-foreground": c.accentForeground,
    "--destructive": c.destructive,
    "--destructive-foreground": c.destructiveForeground,
    "--border": c.border,
    "--input": c.input,
    "--ring": c.ring,
    "--radius": c.radius,
    "--success": c.success,
    "--success-foreground": c.successForeground,
    "--warning": c.warning,
    "--warning-foreground": c.warningForeground,
    "--purple": c.purple,
    "--gradient-primary": c.gradientPrimary,
    "--gradient-secondary": c.gradientSecondary,
    "--gradient-card": c.gradientCard,
    "--gradient-success": c.gradientSuccess,
    "--gradient-warning": c.gradientWarning,
    "--gradient-purple": c.gradientPurple,
    "--shadow-glow": c.shadowGlow,
    "--shadow-card": c.shadowCard,
    "--shadow-elevated": c.shadowElevated,
    "--sidebar-background": c.sidebarBackground,
    "--sidebar-foreground": c.sidebarForeground,
    "--sidebar-primary": c.sidebarPrimary,
    "--sidebar-primary-foreground": c.sidebarPrimaryForeground,
    "--sidebar-accent": c.sidebarAccent,
    "--sidebar-accent-foreground": c.sidebarAccentForeground,
    "--sidebar-border": c.sidebarBorder,
    "--sidebar-ring": c.sidebarRing,
  };
}

/**
 * Applies all brand CSS variables to document.documentElement (:root)
 * and injects the brand font stylesheet.
 *
 * Also injects a <style> block so that `html.dark` overrides apply instantly
 * whenever the ThemeContext toggles the dark class — no JS needed per toggle.
 *
 * Call this ONCE, synchronously, before ReactDOM.createRoot().render()
 * so that all CSS vars are in place before the first paint.
 */
export function applyBrandTheme(config: BrandConfig): void {
  const lightVars = colorsToVars(config.colors);

  // Build :root rule (light-mode defaults)
  const lightRules = Object.entries(lightVars)
    .map(([prop, val]) => `  ${prop}: ${val};`)
    .join("\n");
  // Font family
  const fontRule = `  --font-sans: '${config.fontFamily}', system-ui, sans-serif;`;

  let styleEl = document.getElementById(
    "brand-light",
  ) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "brand-light";
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = `:root {\n${lightRules}\n${fontRule}\n}`;

  // Inject dark-mode overrides as a separate rule — same specificity as :root,
  // so the html.dark block wins purely because it appears AFTER :root.
  if (config.darkColors) {
    const darkColors: BrandColors = { ...config.colors, ...config.darkColors };
    const darkVars = colorsToVars(darkColors);
    const darkRules = Object.entries(darkVars)
      .map(([prop, val]) => `  ${prop}: ${val};`)
      .join("\n");
    const styleId = `brand-dark-${config.id}`;
    let darkEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!darkEl) {
      darkEl = document.createElement("style");
      darkEl.id = styleId;
      document.head.appendChild(darkEl);
    }
    darkEl.textContent = `html.dark {\n${darkRules}\n}`;
  }

  // Inject Google Fonts stylesheet for this brand's font
  if (config.fontUrl && !document.getElementById("brand-font")) {
    const link = document.createElement("link");
    link.id = "brand-font";
    link.rel = "stylesheet";
    link.href = config.fontUrl;
    document.head.appendChild(link);
  }

  // Set browser tab title
  document.title = config.seo.defaultTitle;

  // Swap favicon
  const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (favicon) {
    favicon.href = config.favicon;
  }
}
