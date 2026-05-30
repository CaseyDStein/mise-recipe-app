import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity,
  ImageBackground, TextInput as RNTextInput,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/stores/authStore';
import { Button } from '@/src/components/Button';
import { TextInput } from '@/src/components/TextInput';
import { colors, spacing, typography } from '@/src/lib/theme';

export default function SignUpScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const signUp = useAuthStore((s) => s.signUp);

  const lastNameRef = useRef<RNTextInput>(null);
  const emailRef = useRef<RNTextInput>(null);
  const passwordRef = useRef<RNTextInput>(null);
  const confirmRef = useRef<RNTextInput>(null);

  async function handleSignUp() {
    if (!email || !password) return setError('Please fill in all fields');
    if (password !== confirm) return setError('Passwords do not match');
    if (password.length < 8) return setError('Password must be at least 8 characters');
    setLoading(true);
    setError('');
    try {
      await signUp(email.trim(), password, firstName.trim() || undefined, lastName.trim() || undefined);
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ImageBackground source={require('../../assets/splash.jpg')} style={{ flex: 1 }} resizeMode="cover">
      <View style={styles.overlay} />
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
            label="First Name" placeholder="Jane" value={firstName} onChangeText={setFirstName}
            autoCapitalize="words" returnKeyType="next" onSubmitEditing={() => lastNameRef.current?.focus()}
            leftIcon={<Ionicons name="person-outline" size={18} color={colors.text3} />}
          />
          <TextInput
            ref={lastNameRef}
            label="Last Name" placeholder="Smith" value={lastName} onChangeText={setLastName}
            autoCapitalize="words" returnKeyType="next" onSubmitEditing={() => emailRef.current?.focus()}
            leftIcon={<Ionicons name="person-outline" size={18} color={colors.text3} />}
          />
          <TextInput
            ref={emailRef}
            label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail}
            keyboardType="email-address" autoCapitalize="none" returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            leftIcon={<Ionicons name="mail-outline" size={18} color={colors.text3} />}
          />
          <TextInput
            ref={passwordRef}
            label="Password" placeholder="Min. 8 characters" value={password} onChangeText={setPassword}
            secureTextEntry returnKeyType="next" onSubmitEditing={() => confirmRef.current?.focus()}
            leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.text3} />}
          />
          <TextInput
            ref={confirmRef}
            label="Confirm Password" placeholder="Repeat password" value={confirm} onChangeText={setConfirm}
            secureTextEntry returnKeyType="go" onSubmitEditing={handleSignUp}
            leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.text3} />}
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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  container: { flexGrow: 1, padding: spacing.lg, gap: spacing.xl },
  back: { paddingTop: spacing.xl },
  header: { gap: spacing.sm },
  title: { ...typography.displayMd, color: colors.text0 },
  subtitle: { ...typography.bodyLg, color: colors.text0 },
  form: { gap: spacing.md },
  errorText: { ...typography.bodyMd, color: colors.error, textAlign: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { ...typography.bodyMd, color: colors.text2 },
  link: { ...typography.bodyMd, color: colors.accent, fontWeight: '600' },
});
