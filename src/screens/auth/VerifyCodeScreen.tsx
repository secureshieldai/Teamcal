import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthButton from '../../components/auth/AuthButton';
import OtpInput from '../../components/auth/OtpInput';
import { colors, spacing } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api/auth.service';

export default function VerifyCodeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'VerifyCode'>>();
  const { mode, email, verificationToken } = route.params;
  const [sessionToken,setSessionToken]=useState(verificationToken);
  const { verifyEmail } = useAuth();

  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isComplete = code.every((digit) => digit.length === 1);

  const handleVerify = async () => {
    if (!isComplete) {
      setError('Please enter the full 6-digit code');
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        if (!sessionToken) throw new Error('Verification session is missing. Please sign up again.');
        await verifyEmail(sessionToken, code.join(''));
        navigation.replace('MainTabs');
      } else {
        if (!sessionToken) throw new Error('Verification session is missing. Please request another code.');
        const result=await authService.verifyPasswordReset(sessionToken,code.join(''));
        navigation.navigate('ResetPassword', { email, resetToken:result.resetToken });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not verify the code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!sessionToken || loading) return;
    setError('');
    setLoading(true);
    try {
      const result = mode==='signup' ? await authService.resendVerification(sessionToken) : await authService.requestPasswordReset(email);
      if(mode==='reset' && 'verificationToken' in result)setSessionToken(result.verificationToken as string);
      setError(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend the code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Verify Your Email"
      subtitle={`Enter the 6-digit code we sent to ${email}.`}
      footer={
        <View style={styles.resendRow}>
          <Text style={styles.resendText}>Didn't get a code? </Text>
          <TouchableOpacity onPress={handleResend} disabled={loading} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.resendLink}>Resend</Text>
          </TouchableOpacity>
        </View>
      }
    >
      <OtpInput value={code} onChange={setCode} />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={{ marginTop: spacing.xl }}>
        <AuthButton label="Verify" onPress={handleVerify} loading={loading} />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  error: {
    fontSize: 12,
    color: colors.macroProtein,
    marginTop: spacing.md,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  resendText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  resendLink: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});
