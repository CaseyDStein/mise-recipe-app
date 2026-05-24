import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/stores/authStore';
import { Button } from '@/src/components/Button';
import { TextInput } from '@/src/components/TextInput';
import { colors, spacing, typography, radius } from '@/src/lib/theme';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const signUp = useAuthStore((s) => s.signUp);

  async function handleSignUp() {
    if (!email || !password) return setError('Please fill in all fields');
    if (password !== confirm) return setError('Passwords do not match');
    if (password.length < 8) return setError('Password must be at least 8 characters');
    setLoading(true);
    setError('');
    try {
      await signUp(email.trim(), password);
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <View style={styles.successContainer}>
        <Ionicons name="checkmark-circle" size={72} color={colors.success} />
        <Text style={styles.successTitle}>Check your email</Text>
        <Text style={styles.successBody}>We sent a confirmation link to {email}. Click it to activate your account.</Text>
        <Button label="Back to Login" onPress={() => router.replace('/(auth)/login')} variant="secondary" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text1} />
        </TouchableOpacity>
        <View style={styles.header}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Start your recipe collection today</Text>
        </View>
        <View style={styles.form}>
          <TextInput
            label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail}
            keyboardType="email-address" autoCapitalize="none"
            leftIcon={<Ionicons name="mail-outline" size={18} color={colors.text3} />}
          />
          <TextInput
            label="Password" placeholder="Min. 8 characters" value={password} onChangeText={setPassword}
            secureTextEntry leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.text3} />}
          />
          <TextInput
            label="Confirm Password" placeholder="Repeat password" value={confirm} onChangeText={setConfirm}
            secureTextEntry leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.text3} />}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Button label="Create Account" onPress={handleSignUp} loading={loading} size="lg" />
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity><Text style={styles.link}>Sign in</Text></TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: spacing.lg, gap: spacing.xl },
  back: { paddingTop: spacing.xl },
  header: { gap: spacing.sm },
  title: { ...typography.displayMd, color: colors.text0 },
  subtitle: { ...typography.bodyLg, color: colors.text2 },
  form: { gap: spacing.md },
  errorText: { ...typography.bodyMd, color: colors.error, textAlign: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { ...typography.bodyMd, color: colors.text2 },
  link: { ...typography.bodyMd, color: colors.accent, fontWeight: '600' },
  successContainer: { flex: 1, padding: spacing.xl, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  successTitle: { ...typography.displaySm, color: colors.text0, textAlign: 'center' },
  successBody: { ...typography.bodyLg, color: colors.text2, textAlign: 'center' },
});
