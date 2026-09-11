# Prompt 08 — Reuse Saved API Credentials Securely

For every configured service/provider combination, retain credentials so switching away and back immediately reuses its saved keys. Admins must not re-enter credentials every time.

Requirements:

- Store each provider/service configuration in its own backend row.
- Never return secret values to the frontend; return only `has_api_key` and `has_secret_key` flags.
- Selecting a configured provider must load its saved URL, auth URL, active state and credential-presence flags.
- Activating or saving a configured provider with blank credential inputs must not overwrite stored credentials.
- Display a protected status panel: “Saved credentials will be used automatically.”
- Add an explicit “Update credentials” action that reveals replacement fields.
- Explain that leaving a replacement field blank keeps its stored value.
- Permit canceling credential updates without mutation.
- For a new provider or missing required key, show credential inputs immediately and validate required credentials.
- Interswitch must require both Client ID and Client Secret; other providers require the API token while secret key may be optional.

After a successful credential replacement, clear plaintext state and return to protected status. Verify frontend lint/build/tests and backend update semantics.
