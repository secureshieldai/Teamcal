import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, radii, shadow, spacing } from '../../theme';

type PlanId = 'monthly' | 'yearly';

const PLANS: { id: PlanId; label: string; price: string; badge?: string }[] = [
  { id: 'monthly', label: 'Monthly', price: '$14.99 / month', badge: 'Save 37%' },
  { id: 'yearly', label: 'Yearly', price: '$49.99 / year' },
];

export function PlanSelector() {
  const [selected, setSelected] = useState<PlanId>('monthly');

  return (
    <View style={styles.plans}>
      {PLANS.map((plan) => {
        const isSelected = selected === plan.id;
        return (
          <TouchableOpacity
            key={plan.id}
            style={[styles.planCard, isSelected && styles.planCardSelected]}
            activeOpacity={0.85}
            onPress={() => setSelected(plan.id)}
          >
            {plan.badge ? (
              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText}>{plan.badge}</Text>
              </View>
            ) : null}
            <View style={styles.planRow}>
              <View style={[styles.radio, isSelected && styles.radioSelected]}>
                {isSelected ? <View style={styles.radioDot} /> : null}
              </View>
              <View>
                <Text style={styles.planLabel}>{plan.label}</Text>
                <Text style={styles.planPrice}>{plan.price}</Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function PaymentDetailsForm() {
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('04/27');
  const [cvc, setCvc] = useState('123');
  const [name, setName] = useState('John Doe');

  return (
    <View style={[styles.card, shadow.card]}>
      <Text style={styles.sectionTitle}>Payment Details</Text>

      <View style={styles.field}>
        <View style={styles.fieldLabelRow}>
          <Text style={styles.fieldLabel}>Card Number</Text>
          <View style={styles.visaBadge}>
            <Text style={styles.visaBadgeText}>VISA</Text>
          </View>
        </View>
        <TextInput
          style={styles.input}
          value={cardNumber}
          onChangeText={setCardNumber}
          keyboardType="number-pad"
          placeholder="1234 5678 9012 3456"
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <View style={styles.fieldRow}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.fieldLabel}>Expiry Date</Text>
          <TextInput
            style={styles.input}
            value={expiry}
            onChangeText={setExpiry}
            keyboardType="number-pad"
            placeholder="MM / YY"
            placeholderTextColor={colors.textMuted}
          />
        </View>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.fieldLabel}>CVC</Text>
          <TextInput
            style={styles.input}
            value={cvc}
            onChangeText={setCvc}
            keyboardType="number-pad"
            placeholder="123"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Cardholder Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Full name on card"
          placeholderTextColor={colors.textMuted}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  plans: {
    gap: spacing.md,
    width: '100%',
  },
  planCard: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.xl,
    backgroundColor: colors.card,
    padding: spacing.lg,
    position: 'relative',
  },
  planCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FFF3EC',
  },
  planBadge: {
    position: 'absolute',
    top: -10,
    right: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  planBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  planLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  planPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    width: '100%',
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  field: {
    marginBottom: spacing.md,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  visaBadge: {
    backgroundColor: '#1A1F71',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: spacing.xs,
  },
  visaBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
