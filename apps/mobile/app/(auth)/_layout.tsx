import { View, ImageBackground, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <ImageBackground
      source={require('../../assets/splash.jpg')}
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }} />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
});
