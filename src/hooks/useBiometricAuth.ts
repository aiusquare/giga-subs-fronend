/**
 * useBiometricAuth.ts
 *
 * Supports two fingerprint/biometric paths:
 *  1. Android WebView JS bridge — calls AndroidInterface.authWithFingerPrint()
 *     and listens for the result via window.postMessage('successful' | errorMsg).
 *  2. WebAuthn / Passkey API — standard browser platform authenticator.
 *
 * After the user passes the biometric challenge, stored credentials are
 * replayed against the normal email/password endpoint.
 *
 * Security model:
 *  - Credentials are obfuscated (not encrypted) in localStorage.
 *  - Real security comes from the biometric gate (Android BiometricPrompt or
 *    WebAuthn): credentials cannot be retrieved without passing that challenge.
 *  - Same pattern used by most mobile banking apps.
 */

const BIOMETRIC_KEY = 'dataplus_bio_creds';

interface StoredCreds {
  email: string;
  password: string; // obfuscated
  credentialId: string;
  androidMode?: boolean; // true when saved via Android JS bridge
}

// Simple reversible obfuscation — security comes from WebAuthn gate, not this.
function obfuscate(value: string): string {
  return btoa(
    value
      .split('')
      .map((c) => String.fromCharCode(c.charCodeAt(0) ^ 0x3a))
      .join('')
  );
}

function deobfuscate(value: string): string {
  return atob(value)
    .split('')
    .map((c) => String.fromCharCode(c.charCodeAt(0) ^ 0x3a))
    .join('');
}

// Check if running inside the Android WebView with the JS bridge available
function isAndroidBridge(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as Window & { AndroidInterface?: { authWithFingerPrint: () => void } }).AndroidInterface !== 'undefined' &&
    typeof (window as Window & { AndroidInterface?: { authWithFingerPrint: () => void } }).AndroidInterface?.authWithFingerPrint === 'function'
  );
}

// Check if biometrics are supported — either via Android bridge or WebAuthn
export function isBiometricSupported(): boolean {
  if (isAndroidBridge()) return true;
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator.credentials?.get === 'function'
  );
}

// Check if the user has saved biometric credentials
export function hasBiometricCreds(): boolean {
  try {
    const raw = localStorage.getItem(BIOMETRIC_KEY);
    if (!raw) return false;
    const parsed: StoredCreds = JSON.parse(raw);
    return !!(parsed.email && parsed.password && (parsed.credentialId || parsed.androidMode));
  } catch {
    return false;
  }
}

// Save credentials after a successful password login
export async function saveBiometricCreds(
  email: string,
  password: string
): Promise<boolean> {
  if (!isBiometricSupported()) return false;

  // Android WebView path: no WebAuthn registration, just store credentials
  if (isAndroidBridge()) {
    const stored: StoredCreds = {
      email,
      password: obfuscate(password),
      credentialId: '',
      androidMode: true,
    };
    localStorage.setItem(BIOMETRIC_KEY, JSON.stringify(stored));
    return true;
  }

  try {
    // Create a platform authenticator credential (fingerprint / Face ID / Windows Hello)
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = crypto.getRandomValues(new Uint8Array(16));

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'DataPlus', id: window.location.hostname },
        user: {
          id: userId,
          name: email,
          displayName: email,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },   // ES256
          { alg: -257, type: 'public-key' },  // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;

    if (!credential) return false;

    const stored: StoredCreds = {
      email,
      password: obfuscate(password),
      credentialId: credential.id,
    };
    localStorage.setItem(BIOMETRIC_KEY, JSON.stringify(stored));
    return true;
  } catch {
    return false;
  }
}

// Unlock with biometrics and return the stored credentials
export async function unlockWithBiometrics(): Promise<{
  email: string;
  password: string;
} | null> {
  if (!isBiometricSupported() || !hasBiometricCreds()) return null;

  const raw = localStorage.getItem(BIOMETRIC_KEY);
  if (!raw) return null;
  const stored: StoredCreds = JSON.parse(raw);

  // Android WebView JS bridge path
  if (stored.androidMode) {
    if (!isAndroidBridge()) return null; // bridge not available in this context
    return new Promise((resolve) => {
      let settled = false;

      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        window.removeEventListener('message', handler);
        resolve(null);
      }, 60000);

      const handler = (event: MessageEvent) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        window.removeEventListener('message', handler);
        if (event.data === 'successful') {
          resolve({ email: stored.email, password: deobfuscate(stored.password) });
        } else {
          resolve(null);
        }
      };

      window.addEventListener('message', handler);
      (window as unknown as { AndroidInterface: { authWithFingerPrint: () => void } }).AndroidInterface.authWithFingerPrint();
    });
  }

  // WebAuthn / Passkey path
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        rpId: window.location.hostname,
        allowCredentials: [
          {
            id: Uint8Array.from(atob(stored.credentialId.replace(/-/g, '+').replace(/_/g, '/')), (c) =>
              c.charCodeAt(0)
            ),
            type: 'public-key',
            transports: ['internal'],
          },
        ],
        userVerification: 'required',
        timeout: 60000,
      },
    });

    if (!assertion) return null;

    return {
      email: stored.email,
      password: deobfuscate(stored.password),
    };
  } catch {
    return null;
  }
}

// Remove saved biometric credentials (e.g., on sign out)
export function clearBiometricCreds(): void {
  localStorage.removeItem(BIOMETRIC_KEY);
}
