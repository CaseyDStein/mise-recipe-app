import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, ImageBackground } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/stores/authStore';
import { Button } from '@/src/components/Button';
import { TextInput } from '@/src/components/TextInput';
import { colors, spacing, typography, radius } from '@/src/lib/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const signIn = useAuthStore((s) => s.signIn);

  async function handleLogin() {
    if (!email || !password) return setError('Please fill in all fields');
    setLoading(true);
    setError('');
    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ImageBackground source={require('../../assets/splash.jpg')} style={{ flex: 1 }} resizeMode="cover">
      <View style={styles.overlay} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="restaurant" size={40} color={colors.accent} />
          </View>
          <Text style={styles.title}>The Recipe Organizer</Text>
          <Text style={styles.subtitle}>Your recipe collection, beautifully organized</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            leftIcon={<Ionicons name="mail-outline" size={18} color={colors.text2} />}
          />
          <TextInput
            label="Password"
            placeholder="Your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="current-password"
            leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.text2} />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.text2} />
              </TouchableOpacity>
            }
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Button label="Sign In" style={styles.button} onPress={handleLogin} loading={loading} size="lg" />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity><Text style={styles.link}>Create one</Text></TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  button: { marginTop: spacing.md },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  container: { flexGrow: 1, padding: spacing.lg, justifyContent: 'center', gap: spacing.xl },
  header: { alignItems: 'center', gap: spacing.md },
  logoContainer: {
    width: 80, height: 80, borderRadius: radius.xl,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { ...typography.displayLg, color: colors.text0, textAlign: 'center' },
  subtitle: { ...typography.bodyMd, color: colors.text0, textAlign: 'center' },
  form: { gap: spacing.md },
  errorText: { ...typography.bodyMd, color: colors.error, textAlign: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { ...typography.bodyMd, color: colors.text0 },
  link: { ...typography.bodyMd, color: colors.accent, fontWeight: '600' },
});
