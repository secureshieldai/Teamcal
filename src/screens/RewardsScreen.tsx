import React from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, radii, shadow, spacing, typography } from '../theme';
import { useRewards } from '../hooks/useProfile';
import { useApiQuery } from '../hooks/useApiQuery';
import { earnService } from '../services/api/earn.service';

export default function RewardsScreen() {
  const navigation = useNavigation();
  const { rewardsPoints, rewardsList } = useRewards();
  const redemption = useApiQuery(() => earnService.getRedemptions(), { success: true, redemptions: [], catalog: [] }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Rewards</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.pointsCard}>
          <View>
            <Text style={styles.pointsLabel}>Your Points</Text>
            <Text style={styles.pointsValue}>{rewardsPoints} PTS</Text>
          </View>
          <View style={styles.pointsBadge}>
            <Ionicons name="star" size={30} color={colors.primary} />
          </View>
        </View>

        <View style={[styles.listCard, shadow.card]}>
          <TouchableOpacity style={styles.row} onPress={async()=>{try{await earnService.dailyCheckin();Alert.alert('Claimed','You earned 10 points.');}catch(e){Alert.alert('Check-in',(e as Error).message);}}}>
            <View style={styles.iconCircle}><Ionicons name="calendar-outline" size={17} color={colors.primary}/></View><Text style={styles.label}>Daily Check-in</Text><Text style={styles.points}>+10</Text>
          </TouchableOpacity>
          {rewardsList.map((item, i) => (
            <View key={item.id} style={[styles.row, i === rewardsList.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.iconCircle}>
                <Ionicons name={item.icon} size={17} color={colors.primary} />
              </View>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.points}>{item.points}</Text>
              {item.done && <Ionicons name="checkmark-circle" size={18} color={colors.success} style={{ marginLeft: spacing.sm }} />}
            </View>
          ))}
        </View>
        <Text style={styles.catalogTitle}>Redeem Rewards</Text>
        {redemption.data.catalog.map(reward=><TouchableOpacity key={reward.id} style={styles.rewardCard} onPress={()=>Alert.alert(`Redeem ${reward.label}?`,`${reward.cost} points`,[{text:'Cancel',style:'cancel'},{text:'Redeem',onPress:async()=>{try{await earnService.redeem(reward.id);Alert.alert('Redeemed',reward.label);redemption.refetch();}catch(e){Alert.alert('Unable to redeem',(e as Error).message)}}}])}><Text style={styles.label}>{reward.label}</Text><Text style={styles.points}>{reward.cost} pts</Text></TouchableOpacity>)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  pageTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  pointsCard: {
    backgroundColor: colors.navy,
    borderRadius: radii.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pointsLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  pointsValue: {
    color: colors.white,
    fontSize: 26,
    fontWeight: '800',
    marginTop: 4,
  },
  pointsBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFEDE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  points: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  redeemButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  redeemButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  catalogTitle: { ...typography.h2, marginTop: spacing.xl, marginBottom: spacing.sm },
  rewardCard: { flexDirection:'row',backgroundColor:colors.card,borderRadius:radii.lg,padding:spacing.lg,marginBottom:spacing.sm },
});
