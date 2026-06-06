import React, { useState, useEffect } from 'react';
import { Platform, View } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { initAds } from '@/src/lib/ads';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let NativeBannerAd: React.ComponentType<any> | null = null;
let adSize: any = null;
let adUnitId = '';

if (!isExpoGo) {
  try {
    const ads = require('react-native-google-mobile-ads');
    NativeBannerAd = ads.BannerAd;
    adSize = ads.BannerAdSize.ANCHORED_ADAPTIVE_BANNER;
    // Replace TestIds.BANNER with your real ad unit IDs before publishing:
    //   ios:     'ca-app-pub-xxx/yyy'
    //   android: 'ca-app-pub-xxx/zzz'
    adUnitId = Platform.select({
      ios: ads.TestIds.BANNER,
      android: ads.TestIds.BANNER,
    }) as string;
  } catch {}
}

export function RecipeBannerAd() {
  const [adsReady, setAdsReady] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    initAds().then(() => setAdsReady(true));
  }, []);

  if (!NativeBannerAd || !adsReady) return null;

  return (
    <View style={{ alignItems: 'center', opacity: loaded ? 1 : 0 }}>
      <NativeBannerAd
        unitId={adUnitId}
        size={adSize}
        onAdLoaded={() => setLoaded(true)}
        onAdFailedToLoad={() => setLoaded(false)}
      />
    </View>
  );
}
