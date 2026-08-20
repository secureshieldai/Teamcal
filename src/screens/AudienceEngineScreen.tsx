import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
  audienceEngineTemplates,
} from '../data/earnData';
import type { RootStackParamList } from '../navigation/types';
import { personalService } from '../services/api/personal.service';
import {coachService,type GeneratedAudiencePost} from '../services/api/coach.service';

type Props = NativeStackScreenProps<RootStackParamList, 'AudienceEngine'>;
type AudienceCampaign={id:string;title:string;contentType:string;posts:number;status:string;date:string};

const comingSoon = (feature: string) => Alert.alert('Coming soon', `${feature} isn't available yet.`);

export default function AudienceEngineScreen({ route, navigation }: Props) {
  const sourceLabel = route.params?.sourceLabel;
  const pdfId = route.params?.pdfId;
  const videoId = route.params?.videoId;
  const membershipId = route.params?.membershipId;
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
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [schedulingOption, setSchedulingOption] = useState<'smart' | 'custom' | 'queue'>('smart');
  const [personalCampaigns, setPersonalCampaigns] = useState<AudienceCampaign[]>([]);
  const [generatedPosts,setGeneratedPosts]=useState<GeneratedAudiencePost[]>([]);
  const PLATFORM_COLORS: Record<string,string> = {instagram:'#E1306C',facebook:'#1877F2',linkedin:'#0A66C2',x:'#000000',reddit:'#FF4500',quora:'#B92B27',discord:'#5865F2',tiktok:'#010101',whatsapp:'#25D366'};
  const PLATFORM_ICONS: Record<string,string> = {instagram:'logo-instagram',facebook:'logo-facebook',linkedin:'logo-linkedin',x:'logo-twitter',reddit:'logo-reddit',quora:'help-circle',discord:'logo-discord',tiktok:'musical-notes',whatsapp:'logo-whatsapp'};
  const [connectedAccounts,setConnectedAccounts]=useState<{key:string;label:string;accounts:number;color:string;icon:string}[]>([]);
  const generatePosts=async()=>setGeneratedPosts(await coachService.generateAudience({topic:contentKey||sourceLabel||'Healthy living',instructions:`${instructions}${pdfId?` Include a natural call to action and the links: preview teamcal://pdf/${pdfId}?preview=1, purchase teamcal://pdf/${pdfId}?buy=1, app deep link teamcal://pdf/${pdfId}. Reveal enough to create interest without giving away the complete PDF.`:''}${videoId?` Analyse the video title, description, transcript, captions and key moments. Create hooks, teasers, clip suggestions and watch-now posts. Include video teamcal://video/${videoId}, preview teamcal://video/${videoId}?preview=1, purchase teamcal://video/${videoId}?buy=1, subscription and app deep links.`:''}${membershipId?` Use the community benefits, tiers, trial offer, events, resources, testimonials and FAQs. Create educational, launch and free-trial posts without sounding salesy. Include community teamcal://membership/${membershipId}, tier, trial, event, browser and app deep links.`:''}`,tone,formats,count:Math.min(postsCount,12)}));
  useFocusEffect(useCallback(() => { let active=true;const load=()=>Promise.all([personalService.list<Omit<AudienceCampaign,'id'>>('audience-campaign'),personalService.list<{platform:string;displayName?:string;username?:string;handle?:string}>('audience-account')]).then(([campaigns,accounts])=>{if(!active)return;setPersonalCampaigns(campaigns.map(r=>({id:r.id,...r.data})));// Group by platform for the summary display
    const byPlatform: Record<string,number>={};accounts.forEach(r=>{const p=r.data.platform||'unknown';byPlatform[p]=(byPlatform[p]||0)+1;});const mapped=Object.entries(byPlatform).map(([p,count])=>({key:p,label:p.charAt(0).toUpperCase()+p.slice(1),accounts:count,color:PLATFORM_COLORS[p]||colors.primary,icon:PLATFORM_ICONS[p]||'at-outline'}));setConnectedAccounts(mapped);setSelectedAccounts(current=>current.filter(id=>mapped.some(x=>x.key===id)).concat(mapped.filter(x=>!current.includes(x.key)).map(x=>x.key)));}).catch(()=>{});load();const timer=setInterval(load,15000);return()=>{active=false;clearInterval(timer)}; }, []));

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

          {/* A. Create New Campaign — top section */}
          <TouchableOpacity style={styles.startCard} onPress={startCampaign} activeOpacity={0.9}>
            <View style={styles.startIconLeft}>
              <Ionicons name="add" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.startTitle}>Create New Campaign</Text>
              <Text style={styles.startSubtitle}>Start building your campaign in just a few steps.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.white} />
          </TouchableOpacity>

          {/* B. Quick Start Templates */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Quick Start Templates</Text>
            <TouchableOpacity onPress={() => comingSoon('See all templates')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            {audienceEngineTemplates.map((template) => (
              <TouchableOpacity key={template.key} style={styles.templateCard} onPress={startCampaign}>
                <Ionicons name={template.icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.primary} />
                <Text style={styles.templateLabel}>{template.label}</Text>
                <Text style={styles.templateMeta}>{template.posts} posts</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* C. Recent Campaigns */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Campaigns</Text>
            <TouchableOpacity onPress={() => comingSoon('See all campaigns')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={{ gap: spacing.sm }}>
            {personalCampaigns.map((campaign) => (
              <TouchableOpacity key={campaign.id} style={[styles.campaignRow, shadow.soft]} onPress={() => comingSoon('Campaign details')}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.campaignTitle}>{campaign.title}</Text>
                  <Text style={styles.campaignMeta}>
                    {campaign.contentType} · {campaign.posts} posts
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={[styles.statusBadge, campaign.status === 'Scheduled' ? styles.statusScheduled : campaign.status === 'Published' ? styles.statusPublished : styles.statusDraft]}>
                    <Text style={[styles.statusBadgeText, campaign.status === 'Published' ? styles.statusPublishedText : null]}>{campaign.status}</Text>
                  </View>
                  <Text style={styles.campaignDate}>{campaign.date}</Text>
                </View>
              </TouchableOpacity>
            ))}
            {!personalCampaigns.length?<Text style={styles.campaignMeta}>No campaigns yet.</Text>:null}
          </View>

          {/* Connected Accounts */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Connected Accounts</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AudienceAccounts')}>
              <Text style={styles.manageText}>Manage</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.accountsCard, shadow.soft]}>
            {connectedAccounts.map((account) => (
              <View key={account.key} style={styles.accountItem}>
                <View style={[styles.accountIcon, { backgroundColor: account.color }]}>
                  <Ionicons name={account.icon as keyof typeof Ionicons.glyphMap} size={16} color={colors.white} />
                </View>
                <Text style={styles.accountCount}>{account.accounts}</Text>
                <Text style={styles.accountLabel}>{account.label}</Text>
              </View>
            ))}
            {!connectedAccounts.length?<Text style={styles.accountLabel}>No accounts connected</Text>:null}
          </View>

          {/* Performance Overview */}
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

      {mode === 'wizard' && step === 1 && <SelectContentStep selectedKey={contentKey} onSelect={setContentKey} onNext={() => setStep(2)} accounts={connectedAccounts} />}
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
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xl, marginBottom: spacing.md },
  sectionTitle: { ...typography.h2, fontSize: 15, color: colors.textPrimary },
  manageText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  seeAllText: { fontSize: 12, fontWeight: '700', color: colors.primary },
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
  campaignDate: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  startCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  startTitle: { color: colors.white, fontSize: 15, fontWeight: '800' },
  startSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 11.5, marginTop: 2 },
  startIconLeft: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  statusScheduled: { backgroundColor: 'rgba(255,149,0,0.12)' },
  statusPublished: { backgroundColor: '#E6F9F0' },
  statusDraft: { backgroundColor: colors.background },
  statusBadgeText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  statusPublishedText: { color: '#22C55E' },
  card: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg },
  perfStatsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  perfStat: { alignItems: 'center' },
  perfStatValue: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  perfStatLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 2, fontWeight: '600' },
});
