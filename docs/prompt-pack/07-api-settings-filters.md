# Prompt 07 — Add API Settings Filters

Add a responsive filter panel to `frontend/src/components/admin/AdminApiSettings.tsx`.

Required filters:

- Free-text search across service label, currently selected provider, supported API provider names and descriptions.
- Explicit Service dropdown.
- API Provider dropdown for ADE, MSORG, LUMIID and INTERSWITCH.
- Enabled/disabled status.
- Configured/unconfigured status.

Add an active-filter count, Clear action, `Showing X of Y services`, URL persistence and an empty-results card. Filter only the displayed service cards; do not change Save All semantics. Preserve provider-selection and credential-editing behavior. Verify lint, build, tests and diff whitespace.
