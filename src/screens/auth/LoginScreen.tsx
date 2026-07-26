import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthTextField from '../../components/auth/AuthTextField';
import AuthButton from '../../components/auth/AuthButton';
import SocialButton from '../../components/auth/SocialButton';
import OrDivider from '../../components/auth/OrDivider';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

export default function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { login, socialLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestInFlight = useRef(false);

  const handleLogin = async () => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigation.replace('MainTabs');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not log in. Check your details and try again.');
    } finally {
      requestInFlight.current = false;
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setError('');
    setLoading(true);
    try {
      await socialLogin(provider);
      navigation.replace('MainTabs');
    } catch (err) {
      setError(err instanceof Error ? err.message : `Could not sign in with ${provider}`);
    } finally {
      requestInFlight.current = false;
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back!"
      subtitle="Log in to continue tracking, competing, and winning with your team."
      showBack={false}
      footer={
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.footerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      }
    >
      <AuthTextField
        label="Email"
        icon="mail-outline"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <AuthTextField
        label="Password"
        icon="lock-closed-outline"
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        isPassword
      />

      <TouchableOpacity
        style={styles.forgotLink}
        onPress={() => navigation.navigate('ForgotPassword')}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.forgotText}>Forgot Password?</Text>
      </TouchableOpacity>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <AuthButton label="Log In" onPress={handleLogin} loading={loading} />

      <OrDivider />

      <View style={{ gap: spacing.md }}>
        <SocialButton provider="google" onPress={() => handleSocialLogin('google')} disabled={loading} />
        <SocialButton provider="apple" onPress={() => handleSocialLogin('apple')} disabled={loading} />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  error: {
    fontSize: 12,
    color: colors.macroProtein,
    marginBottom: spacing.md,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
  },
  forgotText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.primary,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});
