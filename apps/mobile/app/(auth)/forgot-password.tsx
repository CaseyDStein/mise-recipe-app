import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/src/components/Button';
import { TextInput } from '@/src/components/TextInput';
import { darkColors as colors, spacing, typography } from '@/src/lib/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!email.trim()) return setError('Please enter your email address');
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Something went wrong');
      }
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text1} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Forgot password?</Text>
          <Text style={styles.subtitle}>
            {sent
              ? "Check your email for a reset link. It may take a minute to arrive."
              : "Enter your email and we'll send you a link to reset your password."}
          </Text>
        </View>

        {!sent && (
          <View style={styles.form}>
            <TextInput
              label="Email"
              labelColor="#FFFFFF"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
              leftIcon={<Ionicons name="mail-outline" size={18} color={colors.text3} />}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <Button label="Send reset link" onPress={handleSubmit} loading={loading} size="lg" />
          </View>
        )}

        {sent && (
          <Button label="Back to sign in" onPress={() => router.replace('/(auth)/login')} variant="secondary" size="lg" />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: spacing.lg, gap: spacing.xl },
  back: { paddingTop: spacing.xl },
  header: { gap: spacing.sm },
  title: { ...typography.displayMd, color: colors.text0 },
  subtitle: { ...typography.bodyLg, color: colors.text1, lineHeight: 26 },
  form: { gap: spacing.md },
  errorText: { ...typography.bodyMd, color: colors.error, textAlign: 'center' },
});
