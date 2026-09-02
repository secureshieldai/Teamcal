import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radii, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ReportChannel'>;

const REPORT_REASONS = [
  { id: 'spam', label: 'Spam or Misleading', icon: 'alert-circle-outline' },
  { id: 'harassment', label: 'Harassment or Bullying', icon: 'warning-outline' },
  { id: 'hate', label: 'Hate Speech', icon: 'close-circle-outline' },
  { id: 'violence', label: 'Violence or Threats', icon: 'shield-outline' },
  { id: 'inappropriate', label: 'Inappropriate Content', icon: 'eye-off-outline' },
  { id: 'impersonation', label: 'Impersonation', icon: 'person-outline' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
];

export default function ReportChannelScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Props['route']>();
  const { channelId } = route.params;

  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Select Reason', 'Please select a reason for reporting');
      return;
    }

    setSubmitting(true);
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated delay
      
      Alert.alert(
        'Report Submitted',
        'Thank you for helping keep our community safe. We\'ll review this report and take appropriate action.',
        [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]
      );
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Report Channel</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
          <Text style={styles.infoText}>
            Your report is anonymous and helps us maintain a safe community. We review all reports carefully.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>SELECT A REASON</Text>

        {REPORT_REASONS.map((reason) => (
          <TouchableOpacity
            key={reason.id}
            style={[styles.reasonCard, selectedReason === reason.id && styles.reasonCardActive]}
            onPress={() => setSelectedReason(reason.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.reasonIcon, selectedReason === reason.id && styles.reasonIconActive]}>
              <Ionicons
                name={reason.icon as any}
                size={20}
                color={selectedReason === reason.id ? colors.white : colors.textSecondary}
              />
            </View>
            <Text style={[styles.reasonText, selectedReason === reason.id && styles.reasonTextActive]}>
              {reason.label}
            </Text>
            {selectedReason === reason.id && (
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionLabel}>ADDITIONAL DETAILS (OPTIONAL)</Text>
        <TextInput
          style={styles.textArea}
          value={details}
          onChangeText={setDetails}
          placeholder="Provide any additional context that might help us understand the issue..."
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={500}
        />
        <Text style={styles.charCount}>{details.length}/500</Text>

        <TouchableOpacity
          style={[styles.submitBtn, (!selectedReason || submitting) && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={!selectedReason || submitting}
        >
          <Text style={styles.submitBtnText}>
            {submitting ? 'Submitting...' : 'Submit Report'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  title: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  content: { padding: spacing.lg },
  infoCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: '#E8F4FF', borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.lg },
  infoText: { flex: 1, fontSize: 12.5, lineHeight: 18, color: colors.textPrimary },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5, marginBottom: spacing.md, marginTop: spacing.md },
  reasonCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1.5, borderColor: 'transparent' },
  reasonCardActive: { borderColor: colors.primary, backgroundColor: '#E8F4FF' },
  reasonIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  reasonIconActive: { backgroundColor: colors.primary },
  reasonText: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  reasonTextActive: { color: colors.primary },
  textArea: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, fontSize: 14, color: colors.textPrimary, minHeight: 120, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: colors.textMuted, textAlign: 'right', marginTop: spacing.xs },
  submitBtn: { backgroundColor: colors.macroProtein, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.xxl },
  submitBtnText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
});
