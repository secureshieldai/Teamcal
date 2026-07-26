import React, { useState } from 'react';
import { Alert, Image, ScrollView, Share, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, radii, shadow, spacing, typography } from '../theme';
import { inviteHero } from '../data/inviteFriendsData';
import { useInvite } from '../hooks/useProfile';
import { useApiQuery } from '../hooks/useApiQuery';
import { earnService } from '../services/api/earn.service';

export default function InviteFriendsScreen() {
  const navigation = useNavigation();
  const { inviteCode } = useInvite();
  const referrals = useApiQuery(() => earnService.getReferrals(), [], []);
  const [name,setName]=useState('');
  const share=()=>Share.share({message:`Join me on TeamCal with invite code ${inviteCode}`});
  const copy=async()=>{try{await (globalThis.navigator as any)?.clipboard?.writeText(inviteCode);Alert.alert('Copied','Invite code copied.')}catch{share()}};

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Invite Friends</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Image source={{ uri: inviteHero }} style={styles.hero} />

        <Text style={styles.headline}>
          Stronger <Text style={{ color: colors.primary }}>Together!</Text>
        </Text>
        <Text style={styles.subtitle}>Invite friends, build your team, and earn rewards.</Text>

        <View style={[styles.codeCard, shadow.card]}>
          <Text style={styles.codeLabel}>Your Invite Code</Text>
          <View style={styles.codeRow}>
            <Text style={styles.code}>{inviteCode}</Text>
            <TouchableOpacity onPress={copy} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="copy-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.earnTitle}>Invite &amp; Earn</Text>
        <View style={[styles.earnCard, shadow.card]}>
          {referrals.data.map((item, i) => (
            <View key={item.id} style={[styles.earnRow, i === referrals.data.length - 1 && { borderBottomWidth: 0 }]}> 
              <Text style={styles.earnLabel}>{item.name || 'Invited friend'} · {item.status}</Text>
              <Text style={styles.earnPoints}>+{item.reward}</Text>
            </View>
          ))}
        </View>
        <TextInput style={styles.nameInput} value={name} onChangeText={setName} placeholder="Friend's name" />
        <TouchableOpacity style={styles.inviteButton} activeOpacity={0.85} onPress={async()=>{if(!name.trim())return share();try{await earnService.inviteReferral(name.trim());setName('');await referrals.refetch();share()}catch(e){Alert.alert('Unable to create invite',(e as Error).message)}}}>
          <Text style={styles.inviteButtonText}>Invite & Share</Text>
        </TouchableOpacity>
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
    alignItems: 'center',
  },
  hero: {
    width: '100%',
    height: 170,
    borderRadius: radii.xl,
    backgroundColor: colors.border,
  },
  headline: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.navy,
    marginTop: spacing.lg,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  codeCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  codeLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  code: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.navy,
    letterSpacing: 2,
  },
  earnTitle: {
    alignSelf: 'flex-start',
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  earnCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
  },
  earnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  earnLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  earnPoints: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  inviteButton: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  nameInput:{width:'100%',backgroundColor:colors.card,borderWidth:1,borderColor:colors.border,borderRadius:radii.md,padding:spacing.md,marginTop:spacing.xl},
  inviteButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
