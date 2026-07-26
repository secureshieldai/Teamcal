import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthTextField from '../../components/auth/AuthTextField';
import AuthButton from '../../components/auth/AuthButton';
import { colors, radii, spacing } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('VerifyCode', { mode: 'reset', email: email || 'you@example.com' });
    }, 700);
  };

  return (
    <AuthLayout title="Forgot Password?" subtitle="Enter the email linked to your account and we'll send you a code to reset your password.">
      <View style={styles.iconWrap}>
        <Ionicons name="lock-closed-outline" size={28} color={colors.primary} />
      </View>

      <AuthTextField
        label="Email"
        icon="mail-outline"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <AuthButton label="Send Reset Code" onPress={handleSendCode} loading={loading} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radii.xl,
    backgroundColor: '#FFEDE3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
});
