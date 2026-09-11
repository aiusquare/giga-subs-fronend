# Prompt 10 — Add Live API Routing to API Settings

Add the same instant API switcher used on Service Pricing to the API Settings page.

The panel must contain:

- Service selector.
- Active API selector populated from saved provider configurations for that service.
- Active label on the current provider.
- Loading state during switching.
- Clear explanation that switching changes both the saved credentials used and the active pricelist.

When an inactive API is selected:

- Call the backend's exclusive provider toggle immediately; no extra Save click.
- Deactivate every other API for that service.
- Update local provider rows.
- Load the newly active provider's saved URL, auth URL and credential-presence state into the service card.
- Exit credential-editing mode and show the protected saved-credentials panel.
- Show a success notification.
- Disable provider choices whose required credentials are incomplete, including Interswitch without both Client ID and Client Secret.

Keep individual service forms, filters and Save actions intact. Verify targeted lint, production build and tests.
