import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthTextField from '../../components/auth/AuthTextField';
import AuthButton from '../../components/auth/AuthButton';
import { colors, spacing } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';
import { authService } from '../../services/api/auth.service';

export default function ResetPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {resetToken}=useRoute<RouteProp<RootStackParamList,'ResetPassword'>>().params;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
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
    try { await authService.resetPassword(resetToken,password);navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); }
    catch(error){setError((error as Error).message);}
    finally{setLoading(false);}
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
