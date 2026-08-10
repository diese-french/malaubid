let wakeLock: WakeLockSentinel | null = null;
let requestInFlight: Promise<void> | null = null;

async function requestScreenWakeLock(): Promise<void> {
  if (
    !('wakeLock' in navigator) ||
    document.visibilityState !== 'visible' ||
    (wakeLock && !wakeLock.released) ||
    requestInFlight
  ) {
    return;
  }

  requestInFlight = (async () => {
    try {
      const requestedLock = await navigator.wakeLock.request('screen');
      wakeLock = requestedLock;
      requestedLock.addEventListener(
        'release',
        () => {
          if (wakeLock === requestedLock) wakeLock = null;
        },
        { once: true },
      );
    } catch {
      // Browsers may refuse a wake lock because of permissions or power saving.
    } finally {
      requestInFlight = null;
    }
  })();

  await requestInFlight;
}

async function releaseScreenWakeLock(): Promise<void> {
  const currentLock = wakeLock;
  wakeLock = null;
  if (currentLock && !currentLock.released) await currentLock.release();
}

export function initializeScreenWakeLock(): void {
  void requestScreenWakeLock();

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void requestScreenWakeLock();
    }
  });
  window.addEventListener('pageshow', () => void requestScreenWakeLock());
  window.addEventListener('pagehide', () => void releaseScreenWakeLock());
}

initializeScreenWakeLock();
