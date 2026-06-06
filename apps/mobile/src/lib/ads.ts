import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Singleton promise — initialization runs exactly once per app session.
let initPromise: Promise<void> | null = null;
let initialized = false;

export function isAdsInitialized() {
  return initialized;
}

export function initAds(): Promise<void> {
  if (isExpoGo) return Promise.resolve();
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const {
        default: MobileAds,
        AdsConsent,
        AdsConsentStatus,
      } = require('react-native-google-mobile-ads');

      // 1. Fetch the latest consent status (triggers ATT on iOS via UMP)
      const consentInfo = await AdsConsent.requestInfoUpdate();

      // 2. Show the consent form if the user hasn't made a choice yet
      if (
        consentInfo.isConsentFormAvailable &&
        consentInfo.status === AdsConsentStatus.REQUIRED
      ) {
        await AdsConsent.loadAndShowConsentFormIfRequired();
      }

      // 3. Initialize the Mobile Ads SDK now that consent is resolved
      await MobileAds().initialize();
      initialized = true;
    } catch (e) {
      // Fail silently — the app works fine without ads
      console.warn('Ads initialization failed:', e);
    }
  })();

  return initPromise;
}
