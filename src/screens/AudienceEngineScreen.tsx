import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import StepIndicator from './earn/audienceEngine/StepIndicator';
import SelectContentStep from './earn/audienceEngine/SelectContentStep';
import InstructionsStep from './earn/audienceEngine/InstructionsStep';
import CustomizeStep from './earn/audienceEngine/CustomizeStep';
import GenerateStep from './earn/audienceEngine/GenerateStep';
import ReviewStep from './earn/audienceEngine/ReviewStep';
import ScheduleStep from './earn/audienceEngine/ScheduleStep';
import MiniLineChart from '../components/charts/MiniLineChart';
import { colors, radii, shadow, spacing, typography } from '../theme';
import {
  audienceEngineConnectedAccounts,
  audienceEngineTemplates,
  audienceEngineCampaigns,
} from '../data/earnData';
import type { RootStackParamList } from '../navigation/types';
import { personalService } from '../services/api/personal.service';
import {coachService,type GeneratedAudiencePost} from '../services/api/coach.service';

type Props = NativeStackScreenProps<RootStackParamList, 'AudienceEngine'>;

const comingSoon = (feature: string) => Alert.alert('Coming soon', `${feature} isn't available yet.`);

export default function AudienceEngineScreen({ route, navigation }: Props) {
  const sourceLabel = route.params?.sourceLabel;
  const [mode, setMode] = useState<'dashboard' | 'wizard'>('dashboard');
  const [step, setStep] = useState(1);

  const [contentKey, setContentKey] = useState('');
  const [instructions, setInstructions] = useState('');
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [tone, setTone] = useState('educational');
  const [avoid, setAvoid] = useState('');
  const [notes, setNotes] = useState('');
  const [postsCount, setPostsCount] = useState(40);
  const [formats, setFormats] = useState<string[]>(['text', 'carousel']);
  const [objective, setObjective] = useState('views');
  const [approvals, setApprovals] = useState<Record<string, 'Approved' | 'Needs Review'>>({});
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(audienceEngineConnectedAccounts.map((a) => a.key));
  const [schedulingOption, setSchedulingOption] = useState<'smart' | 'custom' | 'queue'>('smart');
  const [personalCampaigns, setPersonalCampaigns] = useState<typeof audienceEngineCampaigns>([]);
  const [generatedPosts,setGeneratedPosts]=useState<GeneratedAudiencePost[]>([]);
  const [connectedAccounts,setConnectedAccounts]=useState<{key:string;label:string;accounts:number;color:string;icon:string}[]>([]);
  const generatePosts=async()=>setGeneratedPosts(await coachService.generateAudience({topic:contentKey||sourceLabel||'Healthy living',instructions,tone,formats,count:Math.min(postsCount,12)}));
  useEffect(() => { Promise.all([personalService.list<Omit<(typeof audienceEngineCampaigns)[number], 'id'>>('audience-campaign'),personalService.list<{platform:string;handle:string}>('audience-account')]).then(([campaigns,accounts])=>{setPersonalCampaigns(campaigns.map(r => ({ id:r.id, ...r.data })));const mapped=accounts.map(r=>({key:r.id,label:`${r.data.platform} ${r.data.handle}`,accounts:1,color:colors.primary,icon:'at-outline'}));setConnectedAccounts(mapped);setSelectedAccounts(mapped.map(x=>x.key));}).catch(() => {}); }, []);

  const toggleKeyPoint = (v: string) => setKeyPoints((prev) => (prev.includes(v) ? prev.filter((k) => k !== v) : [...prev, v]));
  const toggleFormat = (key: string) => setFormats((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  const toggleAccount = (key: string) => setSelectedAccounts((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const startCampaign = () => {
    setStep(1);
    setMode('wizard');
  };

  const resetToDashboard = () => {
    setMode('dashboard');
    setStep(1);
    setContentKey('');
    setApprovals({});
  };

  const persistCampaign = async (status: 'Scheduled'|'Draft') => {
    const value = { title: contentKey || sourceLabel || 'My Campaign', contentType: sourceLabel || 'Custom Content', posts: postsCount, status, date: new Date().toLocaleDateString() };
    const record = await personalService.create('audience-campaign', value, { status: status.toLowerCase() });
    await personalService.create('audience-publication',{campaignId:record.id,instructions,keyPoints,tone,avoid,notes,formats,objective,accounts:selectedAccounts,schedulingOption,approvals,postsCount,posts:generatedPosts},{externalKey:record.id,status:status.toLowerCase()});
    setPersonalCampaigns(current => [{ id: record.id, ...value }, ...current]);
  };
  const finishSchedule = async () => {
    try { await persistCampaign('Scheduled'); Alert.alert('Campaign scheduled', `${postsCount} posts have been scheduled across ${selectedAccounts.length} platforms.`, [{ text: 'Done', onPress: resetToDashboard }]); }
    catch(error){ Alert.alert('Unable to schedule campaign',(error as Error).message); }
  };

  const saveDraft = async () => {
    try { await persistCampaign('Draft'); Alert.alert('Saved as draft', 'Your campaign has been saved. You can find it in Recent Campaigns.', [{ text: 'OK', onPress: resetToDashboard }]); }
    catch(error){ Alert.alert('Unable to save draft',(error as Error).message); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (mode === 'wizard' ? resetToDashboard() : navigation.goBack())} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name={mode === 'wizard' ? 'chevron-back' : 'close'} size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Audience Engine</Text>
        <View style={{ width: 22 }} />
      </View>

      {mode === 'wizard' && <StepIndicator currentStep={step} />}

      {mode === 'dashboard' && (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.dashSubtitle}>
            Create, customize and schedule content that grows your audience{sourceLabel ? ` from your ${sourceLabel.toLowerCase()}` : ''}.
          </Text>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Connected Accounts</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AudienceAccounts')}>
              <Text style={styles.manageText}>Manage</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.accountsCard, shadow.soft]}>
            {audienceEngineConnectedAccounts.map((account) => (
              <View key={account.key} style={styles.accountItem}>
                <View style={[styles.accountIcon, { backgroundColor: account.color }]}>
                  <Ionicons name={account.icon as keyof typeof Ionicons.glyphMap} size={16} color={colors.white} />
                </View>
                <Text style={styles.accountCount}>{account.accounts}</Text>
                <Text style={styles.accountLabel}>{account.label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Quick Start Templates</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            {audienceEngineTemplates.map((template) => (
              <TouchableOpacity key={template.key} style={styles.templateCard} onPress={startCampaign}>
                <Ionicons name={template.icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.primary} />
                <Text style={styles.templateLabel}>{template.label}</Text>
                <Text style={styles.templateMeta}>{template.posts} posts</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>Recent Campaigns</Text>
          <View style={{ gap: spacing.sm }}>
            {[...personalCampaigns, ...audienceEngineCampaigns].map((campaign) => (
              <TouchableOpacity key={campaign.id} style={[styles.campaignRow, shadow.soft]} onPress={() => comingSoon('Campaign details')}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.campaignTitle}>{campaign.title}</Text>
                  <Text style={styles.campaignMeta}>
                    {campaign.contentType} · {campaign.posts} posts
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.campaignStatus}>{campaign.status}</Text>
                  <Text style={styles.campaignDate}>{campaign.date}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.startCard} onPress={startCampaign} activeOpacity={0.9}>
            <View style={{ flex: 1 }}>
              <Text style={styles.startTitle}>Create New Campaign</Text>
              <Text style={styles.startSubtitle}>Turn your content into engaging posts in just a few simple steps.</Text>
            </View>
            <View style={styles.startIcon}>
              <Ionicons name="add" size={22} color={colors.primary} />
            </View>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Performance Overview</Text>
          <View style={[styles.card, shadow.card, { marginBottom: spacing.xxl }]}>
            <View style={styles.perfStatsRow}>
              <PerfStat label="Posts Published" value={String(personalCampaigns.filter(x=>x.status==='Scheduled').reduce((n,x)=>n+x.posts,0))} />
              <PerfStat label="Impressions" value="0" />
              <PerfStat label="Link Clicks" value="0" />
            </View>
            <View style={{ alignItems: 'center', marginTop: spacing.md }}>
              <MiniLineChart values={[0,0,0,0,0,0,0]} labels={['Mon','Tue','Wed','Thu','Fri','Sat','Sun']} width={270} />
            </View>
          </View>
        </ScrollView>
      )}

      {mode === 'wizard' && step === 1 && <SelectContentStep selectedKey={contentKey} onSelect={setContentKey} onNext={() => setStep(2)} />}
      {mode === 'wizard' && step === 2 && (
        <InstructionsStep
          instructions={instructions}
          setInstructions={setInstructions}
          keyPoints={keyPoints}
          toggleKeyPoint={toggleKeyPoint}
          tone={tone}
          setTone={setTone}
          avoid={avoid}
          setAvoid={setAvoid}
          notes={notes}
          setNotes={setNotes}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {mode === 'wizard' && step === 3 && (
        <CustomizeStep
          postsCount={postsCount}
          setPostsCount={setPostsCount}
          formats={formats}
          toggleFormat={toggleFormat}
          objective={objective}
          setObjective={setObjective}
          onNext={() => setStep(4)}
          onBack={() => setStep(2)}
        />
      )}
      {mode === 'wizard' && step === 4 && <GenerateStep posts={generatedPosts} generate={generatePosts} onNext={() => setStep(5)} onBack={() => setStep(3)} />}
      {mode === 'wizard' && step === 5 && <ReviewStep posts={generatedPosts} setPosts={setGeneratedPosts} approvals={approvals} setApprovals={setApprovals} onNext={() => setStep(6)} onBack={() => setStep(4)} />}
      {mode === 'wizard' && step === 6 && (
        <ScheduleStep
          accounts={connectedAccounts}
          selectedAccounts={selectedAccounts}
          toggleAccount={toggleAccount}
          schedulingOption={schedulingOption}
          setSchedulingOption={setSchedulingOption}
          onSchedule={finishSchedule}
          onSaveDraft={saveDraft}
          onBack={() => setStep(5)}
        />
      )}
    </SafeAreaView>
  );
}

function PerfStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.perfStat}>
      <Text style={styles.perfStatValue}>{value}</Text>
      <Text style={styles.perfStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  headerTitle: { ...typography.h2, color: colors.textPrimary },
  content: { padding: spacing.lg, paddingTop: 0, paddingBottom: spacing.xxl },
  dashSubtitle: { fontSize: 12, color: colors.textSecondary, lineHeight: 17, marginBottom: spacing.lg },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md, marginBottom: spacing.md },
  sectionTitle: { ...typography.h2, fontSize: 15, color: colors.textPrimary, marginTop: spacing.xl, marginBottom: spacing.md },
  manageText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  accountsCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg },
  accountItem: { alignItems: 'center', gap: 4 },
  accountIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  accountCount: { fontSize: 13, fontWeight: '800', color: colors.textPrimary },
  accountLabel: { fontSize: 9.5, color: colors.textSecondary, fontWeight: '600' },
  templateCard: { width: 100, backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md, alignItems: 'center', gap: 6 },
  templateLabel: { fontSize: 11, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  templateMeta: { fontSize: 9.5, color: colors.textSecondary },
  campaignRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md },
  campaignTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  campaignMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  campaignStatus: { fontSize: 11, fontWeight: '700', color: colors.primary },
  campaignDate: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  startCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  startTitle: { color: colors.white, fontSize: 15, fontWeight: '800' },
  startSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 11.5, marginTop: 2 },
  startIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg },
  perfStatsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  perfStat: { alignItems: 'center' },
  perfStatValue: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  perfStatLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 2, fontWeight: '600' },
});
