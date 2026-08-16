import React, { useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radii, shadow, spacing, typography } from '../theme';
import { useSupplements, type SupplementItem } from '../hooks/useSupplements';
import { FASTING_SUGGESTIONS, TIME_OF_DAY_META } from '../data/supplementData';
import AddSupplementModal from '../components/supplements/AddSupplementModal';
import type { RootStackParamList } from '../navigation/types';

const RING_SIZE = 72;
const RING_STROKE = 7;

function daysLeft(item: SupplementItem) {
  const daysSince = Math.floor((Date.now() - item.createdAt) / 86400000);
  return Math.max(0, item.refillDays - daysSince);
}

export default function SupplementTrackerScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    supplements,
    takenToday,
    takenCountToday,
    total,
    percentToday,
    streak,
    last7Days,
    monthlyCost,
    add,
    update,
    remove,
    toggleTaken,
  } = useSupplements();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SupplementItem | null>(null);
  const [prefillName, setPrefillName] = useState<string | null>(null);

  const radius = (RING_SIZE - RING_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - percentToday / 100);
  const maxDayCount = Math.max(1, ...last7Days.map((d) => d.count));

  const openAdd = () => {
    setEditing(null);
    setPrefillName(null);
    setModalOpen(true);
  };
  const openEdit = (item: SupplementItem) => {
    setEditing(item);
    setModalOpen(true);
  };
  const openSuggestion = (name: string) => {
    setEditing(null);
    setPrefillName(name);
    setModalOpen(true);
  };
  const confirmDelete = (item: SupplementItem) => {
    Alert.alert('Remove supplement?', `"${item.name}" will be removed from your stack.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => remove(item.id) },
    ]);
  };

  const groups = TIME_OF_DAY_META.map((meta) => ({
    meta,
    items: supplements.filter((s) => s.timeOfDay === meta.id),
  })).filter((g) => g.items.length > 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Supplements</Text>
          <Text style={styles.subtitle}>Track & interactions</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#FFE7CF', '#FFD3D9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroLabel}>TODAY'S STACK</Text>
            <Text style={styles.heroValue}>
              {takenCountToday}
              <Text style={styles.heroValueTotal}>/{total}</Text>
            </Text>
            <View style={styles.streakRow}>
              <Ionicons name="flame" size={14} color={colors.primary} />
              <Text style={styles.streakText}>{streak}-day streak</Text>
            </View>
          </View>
          <View style={{ width: RING_SIZE, height: RING_SIZE }}>
            <Svg width={RING_SIZE} height={RING_SIZE} style={{ transform: [{ rotateZ: '-90deg' }] }}>
              <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={radius} stroke="rgba(255,255,255,0.6)" strokeWidth={RING_STROKE} fill="none" />
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={radius}
                stroke={colors.primary}
                strokeWidth={RING_STROKE}
                strokeLinecap="round"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                fill="none"
              />
            </Svg>
            <View style={styles.ringCenter}>
              <Text style={styles.ringText}>{percentToday}%</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={[styles.card, shadow.soft]}>
          <View style={styles.adherenceHeader}>
            <Text style={styles.sectionLabel}>7-DAY ADHERENCE</Text>
            <Ionicons name="trending-up" size={16} color={colors.primary} />
          </View>
          <View style={styles.barsRow}>
            {last7Days.map((d) => (
              <View key={d.key} style={styles.barCol}>
                <Text style={styles.barCount}>{d.count}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: `${Math.max(8, (d.count / maxDayCount) * 100)}%` }]} />
                </View>
                <Text style={styles.barLabel}>{d.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {groups.map((group) => (
          <View key={group.meta.id} style={{ gap: spacing.sm }}>
            <View style={styles.groupHeader}>
              <Ionicons name={group.meta.icon} size={14} color={colors.primary} />
              <Text style={styles.groupLabel}>{group.meta.label.toUpperCase()}</Text>
            </View>
            {group.items.map((item) => {
              const taken = takenToday.has(item.id);
              return (
                <TouchableOpacity key={item.id} style={[styles.itemCard, shadow.soft]} onPress={() => openEdit(item)} activeOpacity={0.85}>
                  <TouchableOpacity style={[styles.checkBtn, taken && styles.checkBtnActive]} onPress={() => toggleTaken(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    {taken && <Ionicons name="checkmark" size={16} color={colors.white} />}
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <View style={styles.itemMetaRow}>
                      <Text style={styles.itemDose}>{item.dose}</Text>
                      {item.takeWithFood && (
                        <View style={styles.foodTag}>
                          <Text style={styles.foodTagText}>w/ food</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.itemFooterRow}>
                      <Ionicons name="notifications-outline" size={11} color={colors.textMuted} />
                      <Text style={styles.itemFooterText}>reminder {item.reminderTime}</Text>
                      <Ionicons name="time-outline" size={11} color={colors.textMuted} style={{ marginLeft: spacing.sm }} />
                      <Text style={styles.itemFooterText}>{daysLeft(item)}d left</Text>
                    </View>
                  </View>
                  <View style={styles.timeBadge}>
                    <Ionicons name="time-outline" size={12} color={colors.textPrimary} />
                    <Text style={styles.timeBadgeText}>{item.reminderTime}</Text>
                  </View>
                  <TouchableOpacity onPress={() => confirmDelete(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="trash-outline" size={17} color={colors.textMuted} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {supplements.length === 0 && <Text style={styles.empty}>No supplements yet. Add your first one below.</Text>}

        <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.85}>
          <Ionicons name="add" size={18} color={colors.white} />
          <Text style={styles.addBtnText}>Add supplement</Text>
        </TouchableOpacity>

        <View style={[styles.card, shadow.soft, styles.costRow]}>
          <View>
            <Text style={styles.sectionLabel}>MONTHLY COST</Text>
            <Text style={styles.costValue}>${Math.round(monthlyCost)}</Text>
          </View>
          <View style={styles.costIcon}>
            <Ionicons name="cash-outline" size={18} color={colors.primary} />
          </View>
        </View>

        <View style={[styles.card, shadow.soft]}>
          <View style={styles.groupHeader}>
            <Ionicons name="notifications-outline" size={14} color={colors.primary} />
            <Text style={styles.groupLabel}>POPULAR DURING FASTING</Text>
          </View>
          <View style={styles.suggestionWrap}>
            {FASTING_SUGGESTIONS.map((name) => (
              <TouchableOpacity key={name} style={styles.suggestionChip} onPress={() => openSuggestion(name)}>
                <Text style={styles.suggestionText}>+ {name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <AddSupplementModal
        visible={modalOpen}
        initial={editing ?? (prefillName ? { name: prefillName } : null)}
        onClose={() => setModalOpen(false)}
        onSubmit={async (item) => {
          if (editing) await update(editing.id, item);
          else await add(item);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  headerText: { flex: 1 },
  title: { ...typography.h1, color: colors.navy },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  hero: { flexDirection: 'row', alignItems: 'center', borderRadius: radii.xl, padding: spacing.xl },
  heroLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(20,20,43,0.55)', letterSpacing: 0.6 },
  heroValue: { fontSize: 36, fontWeight: '800', color: colors.textPrimary, marginTop: spacing.xs },
  heroValueTotal: { fontSize: 20, fontWeight: '700', color: 'rgba(20,20,43,0.5)' },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
  streakText: { fontSize: 12.5, fontWeight: '700', color: colors.textPrimary },
  ringCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  ringText: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  card: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg },
  adherenceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5 },
  barsRow: { flexDirection: 'row', justifyContent: 'space-between', height: 90, alignItems: 'flex-end' },
  barCol: { alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' },
  barCount: { fontSize: 11, color: colors.textSecondary, marginBottom: 4 },
  barTrack: { width: 18, height: 40, justifyContent: 'flex-end' },
  barFill: { width: 18, borderRadius: 9, backgroundColor: colors.primary },
  barLabel: { fontSize: 10.5, color: colors.textMuted, marginTop: spacing.xs, fontWeight: '600' },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  groupLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5 },
  itemCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg },
  checkBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  checkBtnActive: { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
  itemName: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  itemMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
  itemDose: { fontSize: 12.5, color: colors.textSecondary },
  foodTag: { backgroundColor: colors.background, borderRadius: radii.sm, paddingHorizontal: 6, paddingVertical: 2 },
  foodTagText: { fontSize: 10.5, fontWeight: '600', color: colors.textSecondary },
  itemFooterRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: spacing.xs },
  itemFooterText: { fontSize: 10.5, color: colors.textMuted },
  timeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.background, borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 5 },
  timeBadgeText: { fontSize: 11.5, fontWeight: '700', color: colors.textPrimary },
  empty: { textAlign: 'center', color: colors.textMuted, fontSize: 13, paddingVertical: spacing.md },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md },
  addBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  costRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  costValue: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginTop: 4 },
  costIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FDECE4', alignItems: 'center', justifyContent: 'center' },
  suggestionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  suggestionChip: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.background },
  suggestionText: { fontSize: 12.5, fontWeight: '600', color: colors.textPrimary },
});
