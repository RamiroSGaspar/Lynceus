const CONSENT_KEY = 'assistant.consent.v1';

export function hasConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === 'accepted';
  } catch {
    return false;
  }
}

export function saveConsent(): void {
  try {
    localStorage.setItem(CONSENT_KEY, 'accepted');
  } catch {
    // Without storage the notice simply shows again next time.
  }
}
