/**
 * androidBridge.ts
 *
 * Thin wrapper around the Android WebView JS interface (AndroidInterface).
 * All functions are safe to call in a plain browser — they become no-ops when
 * the bridge is unavailable.
 */

interface AndroidBridge {
  authWithFingerPrint(): void;
  showNotification(title: string, message: string): void;
  shareReceipt(base64Image: string): void;
  triggerContactPicker(): void;
}

function getBridge(): AndroidBridge | null {
  if (
    typeof window !== 'undefined' &&
    'AndroidInterface' in window &&
    typeof (window as unknown as Record<string, unknown>)['AndroidInterface'] === 'object'
  ) {
    return (window as unknown as { AndroidInterface: AndroidBridge }).AndroidInterface;
  }
  return null;
}

/** Returns true when the app is running inside the Android WebView. */
export function isAndroidWebView(): boolean {
  return getBridge() !== null;
}

/**
 * Show a native Android notification.
 * Safe to call in any environment — becomes a no-op in plain browsers.
 */
export function showAndroidNotification(title: string, message: string): void {
  getBridge()?.showNotification(title, message);
}

/**
 * Trigger the Android biometric prompt.
 * Safe to call in any environment.
 */
export function triggerAndroidFingerprint(): void {
  getBridge()?.authWithFingerPrint();
}

/**
 * Share a receipt image (base64 PNG) via the Android share sheet.
 */
export function shareReceiptViaAndroid(base64Image: string): void {
  getBridge()?.shareReceipt(base64Image);
}

/**
 * Open the Android contacts picker.
 */
export function triggerAndroidContactPicker(): void {
  getBridge()?.triggerContactPicker();
}

/**
 * Returns true when the browser supports the Contact Picker API
 * (Chrome on Android 80+, Samsung Internet 11+).
 */
export function isBrowserContactPickerSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'contacts' in navigator &&
    typeof (navigator as Navigator & { contacts?: { select: unknown } }).contacts?.select === 'function'
  );
}

/**
 * Returns true when any contact picker is available
 * (Android bridge OR browser Contact Picker API).
 */
export function isContactPickerAvailable(): boolean {
  return getBridge() !== null || isBrowserContactPickerSupported();
}

/**
 * Normalize a raw phone number string to a Nigerian local format (08XXXXXXXXX).
 */
export function normalizeNigerianNumber(raw: string): string {
  let n = raw.replace(/\s/g, '');
  // Strip leading + or country code 234
  if (n.startsWith('+234')) n = '0' + n.slice(4);
  else if (n.startsWith('234') && n.length >= 13) n = '0' + n.slice(3);
  return n;
}

/**
 * Open the best available contacts picker and resolve with a phone number
 * string, or null if the user cancelled or nothing was picked.
 *
 * - In the Android WebView it calls AndroidInterface.triggerContactPicker()
 *   and waits for a postMessage reply.
 * - In a supporting browser it uses the Contact Picker API directly.
 */
export async function pickContactPhone(): Promise<string | null> {
  // ── Browser Contact Picker API ───────────────────────────────────────────
  if (isBrowserContactPickerSupported()) {
    try {
      const contactsApi = (navigator as Navigator & {
        contacts: { select(props: string[], opts?: { multiple: boolean }): Promise<Array<{ tel?: string[] }>> };
      }).contacts;
      const results = await contactsApi.select(['tel'], { multiple: false });
      if (results.length > 0 && results[0].tel && results[0].tel.length > 0) {
        return normalizeNigerianNumber(results[0].tel[0]);
      }
    } catch {
      // user dismissed or API unavailable
    }
    return null;
  }

  // ── Android JS bridge ────────────────────────────────────────────────────
  const bridge = getBridge();
  if (!bridge) return null;

  return new Promise((resolve) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      window.removeEventListener('message', handler);
      resolve(null);
    }, 30_000);

    const handler = (event: MessageEvent) => {
      if (settled) return;
      const raw = String(event.data ?? '').trim();
      // Only accept digit-only strings that look like phone numbers
      if (/^\d{10,11}$/.test(raw.replace(/\s/g, '')) || /^\+?234\d{10}$/.test(raw)) {
        settled = true;
        clearTimeout(timer);
        window.removeEventListener('message', handler);
        resolve(normalizeNigerianNumber(raw));
      }
    };

    window.addEventListener('message', handler);
    bridge.triggerContactPicker();
  });
}
