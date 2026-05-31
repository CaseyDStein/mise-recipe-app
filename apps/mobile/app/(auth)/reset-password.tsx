import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/src/components/Button';
import { TextInput } from '@/src/components/TextInput';
import { darkColors as colors, spacing, typography } from '@/src/lib/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleReset() {
    if (!password || !confirm) return setError('Please fill in both fields');
    if (password !== confirm) return setError('Passwords do not match');
    if (password.length < 8) return setError('Password must be at least 8 characters');
    if (!token) return setError('Invalid reset link');

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong');
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Invalid reset link. Please request a new one.</Text>
        <Button label="Back to sign in" onPress={() => router.replace('/(auth)/login')} variant="secondary" />
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
          <Text style={styles.title}>{done ? 'Password reset' : 'Set new password'}</Text>
          <Text style={styles.subtitle}>
            {done
              ? 'Your password has been updated. You can now sign in with your new password.'
              : 'Choose a new password for your account.'}
          </Text>
        </View>

        {!done && (
          <View style={styles.form}>
            <TextInput
              label="New password"
              labelColor="#FFFFFF"
              placeholder="Min. 8 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="next"
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.text3} />}
            />
            <TextInput
              label="Confirm new password"
              labelColor="#FFFFFF"
              placeholder="Repeat password"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              returnKeyType="go"
              onSubmitEditing={handleReset}
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.text3} />}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <Button label="Reset password" onPress={handleReset} loading={loading} size="lg" />
          </View>
        )}

        {done && (
          <Button label="Sign in" onPress={() => router.replace('/(auth)/login')} size="lg" />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: spacing.lg, gap: spacing.xl },
  centered: { flex: 1, padding: spacing.lg, gap: spacing.xl, justifyContent: 'center' },
  back: { paddingTop: spacing.xl },
  header: { gap: spacing.sm },
  title: { ...typography.displayMd, color: colors.text0 },
  subtitle: { ...typography.bodyLg, color: colors.text1, lineHeight: 26 },
  form: { gap: spacing.md },
  errorText: { ...typography.bodyMd, color: colors.error, textAlign: 'center' },
});
