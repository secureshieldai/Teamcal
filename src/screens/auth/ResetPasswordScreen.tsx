import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthTextField from '../../components/auth/AuthTextField';
import AuthButton from '../../components/auth/AuthButton';
import { colors, spacing } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

export default function ResetPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReset = () => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }, 700);
  };

  return (
    <AuthLayout title="Create New Password" subtitle="Your new password must be different from previously used passwords.">
      <AuthTextField
        label="New Password"
        icon="lock-closed-outline"
        placeholder="Enter new password"
        value={password}
        onChangeText={setPassword}
        isPassword
      />
      <AuthTextField
        label="Confirm New Password"
        icon="lock-closed-outline"
        placeholder="Re-enter new password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        isPassword
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <AuthButton label="Reset Password" onPress={handleReset} loading={loading} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  error: {
    fontSize: 12,
    color: colors.macroProtein,
    marginBottom: spacing.md,
  },
});
