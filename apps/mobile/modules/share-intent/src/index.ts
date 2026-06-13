import { requireOptionalNativeModule, EventEmitter, Subscription } from 'expo-modules-core';

// Optional so the JS bundle doesn't crash in environments where the native
// module hasn't been compiled yet (e.g. before the first `expo run:ios/android`).
const ShareIntentModule = requireOptionalNativeModule('ShareIntent');
const emitter = ShareIntentModule ? new EventEmitter(ShareIntentModule) : null;

/** Returns the URL that was shared to the app, then clears it. Returns null if none pending. */
export function getSharedUrl(): Promise<string | null> {
  return ShareIntentModule?.getSharedUrl() ?? Promise.resolve(null);
}

/** Fires on Android when a share intent arrives while the app is already running. */
export function addSharedUrlListener(listener: (url: string) => void): Subscription {
  return (
    emitter?.addListener<{ url: string }>('onSharedUrl', ({ url }) => listener(url)) ?? {
      remove: () => {},
    }
  );
}
