import React, { useCallback, useState } from 'react';
import { Alert, Image, ScrollView, Share, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { earnService, type EarnAsset, type PdfMetadata } from '../services/api/earn.service';
import StatusBadge from './earn/components/StatusBadge';
import { colors, radii, shadow, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PdfDashboard'>;

type ActionKey =
  | 'editDetails' | 'replace' | 'newEdition' | 'cover' | 'previewSettings' | 'pricing'
  | 'publicPage' | 'share' | 'qr' | 'promote' | 'showcase' | 'pauseUnpublish' | 'archive' | 'delete';

const ACTIONS: { label: string; icon: keyof typeof Ionicons.glyphMap; key: ActionKey; danger?: boolean }[] = [
  { label: 'Edit details', icon: 'create-outline', key: 'editDetails' },
  { label: 'Replace PDF', icon: 'swap-horizontal-outline', key: 'replace' },
  { label: 'Upload new edition', icon: 'cloud-upload-outline', key: 'newEdition' },
  { label: 'Change cover', icon: 'image-outline', key: 'cover' },
  { label: 'Preview settings', icon: 'eye-outline', key: 'previewSettings' },
  { label: 'Pricing & discounts', icon: 'pricetag-outline', key: 'pricing' },
  { label: 'View public page', icon: 'globe-outline', key: 'publicPage' },
  { label: 'Copy/share PDF link', icon: 'link-outline', key: 'share' },
  { label: 'Generate QR code', icon: 'qr-code-outline', key: 'qr' },
  { label: 'Promote with Audience Engine', icon: 'megaphone-outline', key: 'promote' },
];

export default function PdfDashboardScreen({ route, navigation }: Props) {
  const { pdfId } = route.params;
  const [pdf, setPdf] = useState<EarnAsset | null>(null);
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => earnService.getAsset(pdfId).then(setPdf).catch(e => setError(e.message)), [pdfId]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!pdf) {
    return (
      <SafeAreaView style={s.safe}>
        <Header title="PDF dashboard" back={navigation.goBack} />
        <Text style={s.empty}>{error || 'Loading PDF…'}</Text>
      </SafeAreaView>
    );
  }

  const m = pdf.metrics || {};
  const md = (pdf.metadata as PdfMetadata) || {};
  const views = Number(m.views || 0), purchases = Number(m.purchases || 0);
  const conversion = views ? (purchases / views) * 100 : 0;
  const showcased = Boolean(md.addToShowcase);
  const isArchived = pdf.status === 'archived';
  const isPaused = pdf.status === 'paused';
  const publicLink = `https://teamcal.app/pdf/${pdf.id}`;

  const act = async (key: ActionKey) => {
    if (key === 'editDetails') return navigation.navigate('PdfEditDetails', { pdfId: pdf.id });
    if (key === 'replace') return navigation.navigate('PdfReplace', { pdfId: pdf.id });
    if (key === 'newEdition') return navigation.navigate('PdfNewEdition', { pdfId: pdf.id });
    if (key === 'cover') return navigation.navigate('PdfCover', { pdfId: pdf.id });
    if (key === 'previewSettings') return navigation.navigate('PdfPreviewSettings', { pdfId: pdf.id });
    if (key === 'pricing') return navigation.navigate('PdfPricing', { pdfId: pdf.id });
    if (key === 'publicPage') return navigation.navigate('PdfReader', { pdfId: pdf.id, preview: true });
    if (key === 'promote') return navigation.navigate('AudienceEngine', { sourceLabel: pdf.title, pdfId: pdf.id });
    if (key === 'qr') return navigation.navigate('PdfQrCode', { pdfId: pdf.id });
    if (key === 'share') {
      Alert.alert('Share PDF', undefined, [
        { text: 'Copy link', onPress: async () => { await Clipboard.setStringAsync(publicLink); Alert.alert('PDF link copied.'); } },
        { text: 'Share…', onPress: () => Share.share({ message: `Check out "${pdf.title}": ${publicLink}` }) },
        { text: 'Open public page', onPress: () => navigation.navigate('PdfReader', { pdfId: pdf.id, preview: true }) },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    if (key === 'showcase') {
      const next = !showcased;
      try {
        const updated = await earnService.updateAsset(pdf.id, { metadata: { ...md, addToShowcase: next } });
        setPdf(updated);
      } catch (e) { Alert.alert('Error', (e as Error).message); }
      return;
    }
    if (key === 'pauseUnpublish') {
      const willPause = pdf.status !== 'paused';
      Alert.alert(
        willPause ? 'Pause this PDF?' : 'Resume this PDF?',
        willPause
          ? 'Pausing will stop new purchases and hide this PDF from public listings. Existing buyers keep full access to their purchase and downloads. Shared links and QR codes will show as unavailable. Any scheduled promotions referencing this PDF will be paused too. You can publish or resume it at any time.'
          : 'This PDF will become publicly visible and available for new purchases again.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: willPause ? 'Pause PDF' : 'Resume PDF', style: willPause ? 'destructive' : 'default', onPress: async () => {
              try { const updated = await earnService.updateAsset(pdf.id, { status: willPause ? 'paused' : 'published' }); setPdf(updated); }
              catch (e) { Alert.alert('Error', (e as Error).message); }
            },
          },
        ],
      );
      return;
    }
    if (key === 'archive') {
      Alert.alert(
        'Archive this PDF?',
        'This PDF will be removed from your active PDFs and moved to Archived PDFs. You can restore it later.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Archive PDF', onPress: async () => {
              try { await earnService.updateAsset(pdf.id, { status: 'archived' }); navigation.goBack(); }
              catch (e) { Alert.alert('Error', (e as Error).message); }
            },
          },
        ],
      );
      return;
    }
    if (key === 'delete') { setDeleteConfirm(''); setDeleteModal(true); return; }
  };

  const confirmDelete = async () => {
    if (deleteConfirm.trim() !== pdf.title) return;
    setDeleting(true);
    try {
      await earnService.deleteAsset(pdf.id);
      setDeleteModal(false);
      navigation.goBack();
      setTimeout(() => Alert.alert('PDF deleted successfully.'), 300);
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <Header title={pdf.title} back={navigation.goBack} />
      <ScrollView contentContainerStyle={s.content}>
        {isArchived && (
          <View style={s.archivedBanner}>
            <Ionicons name="archive-outline" size={16} color="#92400E" />
            <Text style={s.archivedBannerText}>This PDF is archived and hidden from your active list.</Text>
            <TouchableOpacity onPress={async () => { try { const updated = await earnService.updateAsset(pdf.id, { status: 'draft' }); setPdf(updated); } catch (e) { Alert.alert('Error', (e as Error).message); } }}>
              <Text style={s.archivedRestore}>Restore</Text>
            </TouchableOpacity>
          </View>
        )}
        {isPaused && (
          <View style={[s.archivedBanner, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="pause-circle-outline" size={16} color="#B91C1C" />
            <Text style={[s.archivedBannerText, { color: '#B91C1C' }]}>This PDF is paused — hidden from public listings and unavailable for new purchases.</Text>
          </View>
        )}

        <View style={[s.hero, shadow.card]}>
          <Image source={{ uri: pdf.image || `https://picsum.photos/seed/${pdf.id}/320/460` }} style={s.cover} />
          <View style={{ flex: 1 }}>
            <View style={s.titleRow}>
              <Text style={s.title}>{pdf.title}</Text>
              <StatusBadge status={pdf.status} />
            </View>
            <Text style={s.author}>{md.author || 'Independent creator'} · {md.category || 'Digital resource'}</Text>
            <Text style={s.price}>{md.isFree ? 'Free' : `${pdf.currency} ${Number(pdf.price).toFixed(2)}`}</Text>
            <TouchableOpacity style={s.preview} onPress={() => navigation.navigate('PdfReader', { pdfId: pdf.id, preview: true })}>
              <Text style={s.previewText}>Open preview</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={s.sectionTitle}>Performance summary</Text>
        <View style={s.grid}>
          <Stat label="Preview views" value={views} />
          <Stat label="Full purchases" value={purchases} />
          <Stat label="Readers" value={Number(m.readers || purchases)} />
          <Stat label="Completion" value={`${Number(m.completion || 0).toFixed(1)}%`} />
          <Stat label="Downloads" value={Number(m.downloads || 0)} />
          <Stat label="Reviews" value={(md.reviews || []).length} />
          <Stat label="Rating" value={`${Number(m.rating || 0).toFixed(1)} ★`} />
          <Stat label="Refunds" value={Number(m.refunds || 0)} />
          <Stat label="Total earnings" value={`$${Number(m.earned || 0).toFixed(2)}`} />
          <Stat label="Conversion" value={`${conversion.toFixed(1)}%`} />
        </View>

        <Text style={s.sectionTitle}>Sales funnel</Text>
        <View style={[s.card, shadow.soft]}>
          {[['Page opened', m.pageViews || views], ['Preview started', m.previewStarts || views], ['Preview completed', m.previewCompleted || 0], ['Buy clicked', m.buyClicks || 0], ['Payment completed', purchases]].map(([x, v], i) => (
            <View key={String(x)} style={s.funnel}>
              <Text style={s.funnelLabel}>{x}</Text>
              <View style={[s.bar, { width: `${Math.max(3, 100 - i * 18)}%` }]} />
              <Text style={s.funnelValue}>{Number(v)}</Text>
            </View>
          ))}
        </View>

        <Text style={s.sectionTitle}>Audience insights</Text>
        <View style={[s.card, shadow.soft]}>
          <Text style={s.insight}>Top locations and traffic sources will appear as readers discover this PDF.</Text>
          <View style={s.insightRow}>
            <Stat label="Top country" value={String(m.topCountry || '—')} />
            <Stat label="Top source" value={String(m.topSource || '—')} />
          </View>
          <Text style={s.insight}>Most-read pages: {String(m.mostReadPages || 'Not enough data')}</Text>
        </View>

        <Text style={s.sectionTitle}>Reviews and ratings</Text>
        <TouchableOpacity style={[s.card, shadow.soft]} onPress={() => navigation.navigate('PdfReviews', { pdfId: pdf.id })}>
          <Text style={s.actionLabel}>{(md.reviews || []).length} reviews · View, reply and moderate</Text>
          <Ionicons name="chevron-forward" size={18} />
        </TouchableOpacity>

        <Text style={s.sectionTitle}>PDF settings and actions</Text>
        <View style={[s.card, shadow.soft]}>
          {ACTIONS.map((a, i) => (
            <TouchableOpacity key={a.key} style={[s.action, i === ACTIONS.length - 1 && { borderBottomWidth: 0 }]} onPress={() => act(a.key)}>
              <Ionicons name={a.icon} size={18} color={colors.primary} />
              <Text style={s.actionLabel}>{a.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={[s.card, shadow.soft, { marginTop: spacing.md }]}>
          <View style={s.showcaseRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.actionLabel}>Add to My Showcase</Text>
              <Text style={s.showcaseSub}>{showcased ? 'This PDF appears in your public profile Showcase.' : 'Show this PDF in your public profile Showcase.'}</Text>
            </View>
            <Switch value={showcased} onValueChange={() => act('showcase')} trackColor={{ true: colors.primary }} thumbColor="#fff" />
          </View>
        </View>

        <Text style={s.sectionTitle}>Status</Text>
        <View style={[s.card, shadow.soft]}>
          <TouchableOpacity style={s.action} onPress={() => act('pauseUnpublish')}>
            <Ionicons name="pause-circle-outline" size={18} color={colors.primary} />
            <Text style={s.actionLabel}>{isPaused ? 'Resume / Publish PDF' : 'Unpublish / pause'}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
          {!isArchived && (
            <TouchableOpacity style={s.action} onPress={() => act('archive')}>
              <Ionicons name="archive-outline" size={18} color={colors.primary} />
              <Text style={s.actionLabel}>Archive PDF</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[s.action, { borderBottomWidth: 0 }]} onPress={() => act('delete')}>
            <Ionicons name="trash-outline" size={18} color="#D33" />
            <Text style={[s.actionLabel, { color: '#D33' }]}>Delete PDF</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {deleteModal && (
        <View style={s.overlay}>
          <View style={s.deleteSheet}>
            <Text style={s.deleteTitle}>Delete this PDF permanently?</Text>
            <Text style={s.deleteBody}>
              This will permanently delete the PDF and may remove its file, cover, settings, previews and public page. This action cannot be undone.{'\n\n'}
              Existing buyers keep access to their purchase and downloads on record. Purchase and transaction records are retained for accounting; refunds already processed are unaffected. Shared links and QR codes will stop working. Analytics for this PDF will no longer be accessible.
            </Text>
            <Text style={s.deleteConfirmLabel}>Type the PDF title to confirm:</Text>
            <TextInput style={s.deleteInput} value={deleteConfirm} onChangeText={setDeleteConfirm} placeholder={pdf.title} placeholderTextColor={colors.textMuted} />
            <View style={s.deleteActions}>
              <TouchableOpacity style={s.deleteCancel} onPress={() => setDeleteModal(false)}>
                <Text style={s.deleteCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.deleteConfirmBtn, deleteConfirm.trim() !== pdf.title && { opacity: 0.4 }]}
                disabled={deleteConfirm.trim() !== pdf.title || deleting}
                onPress={confirmDelete}
              >
                <Text style={s.deleteConfirmText}>{deleting ? 'Deleting…' : 'Delete PDF Permanently'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function Header({ title, back }: { title: string; back: () => void }) {
  return (
    <View style={s.header}>
      <TouchableOpacity onPress={back}><Ionicons name="chevron-back" size={23} /></TouchableOpacity>
      <Text style={s.headerTitle} numberOfLines={1}>{title}</Text>
      <View style={{ width: 23 }} />
    </View>
  );
}
function Stat({ label, value }: { label: string; value: string | number }) {
  return <View style={s.stat}><Text style={s.statValue}>{value}</Text><Text style={s.statLabel}>{label}</Text></View>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg },
  headerTitle: { ...typography.h2, flex: 1, textAlign: 'center' },
  content: { padding: spacing.lg, paddingBottom: 40 },
  empty: { textAlign: 'center', marginTop: 80, color: colors.textSecondary },
  archivedBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: '#FEF3C7', borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.md },
  archivedBannerText: { flex: 1, fontSize: 11.5, color: '#92400E', fontWeight: '600' },
  archivedRestore: { fontSize: 12, fontWeight: '800', color: colors.primary },
  hero: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md, flexDirection: 'row', gap: spacing.md },
  cover: { width: 88, height: 122, borderRadius: radii.md, backgroundColor: colors.border },
  titleRow: { gap: 6 },
  title: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  author: { fontSize: 11, color: colors.textSecondary, marginTop: 5 },
  price: { fontSize: 15, fontWeight: '800', color: colors.primary, marginTop: 10 },
  preview: { backgroundColor: colors.primary, borderRadius: radii.pill, padding: 9, alignItems: 'center', marginTop: 10 },
  previewText: { fontSize: 11, color: '#fff', fontWeight: '800' },
  sectionTitle: { ...typography.h2, fontSize: 15, marginTop: spacing.xl, marginBottom: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: { backgroundColor: colors.card, borderRadius: radii.lg, padding: 12, width: '31%', minHeight: 68 },
  statValue: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  statLabel: { fontSize: 9.5, color: colors.textSecondary, marginTop: 4 },
  card: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md },
  funnel: { marginBottom: 10 },
  funnelLabel: { fontSize: 10.5, color: colors.textSecondary },
  bar: { height: 5, backgroundColor: colors.primary, borderRadius: 3, marginTop: 4 },
  funnelValue: { fontSize: 10, fontWeight: '700', position: 'absolute', right: 0 },
  insight: { fontSize: 11, color: colors.textSecondary, lineHeight: 17 },
  insightRow: { flexDirection: 'row', gap: 8, marginVertical: 10 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.border },
  actionLabel: { fontSize: 12.5, fontWeight: '600', color: colors.textPrimary, flex: 1 },
  showcaseRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  showcaseSub: { fontSize: 10.5, color: colors.textSecondary, marginTop: 2 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg },
  deleteSheet: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg },
  deleteTitle: { fontSize: 16, fontWeight: '800', color: '#EF4444', marginBottom: spacing.sm },
  deleteBody: { fontSize: 12, color: colors.textSecondary, lineHeight: 18, marginBottom: spacing.md },
  deleteConfirmLabel: { fontSize: 12, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  deleteInput: { backgroundColor: colors.background, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, fontSize: 13, color: colors.textPrimary },
  deleteActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  deleteCancel: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border },
  deleteCancelText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  deleteConfirmBtn: { flex: 1.6, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radii.pill, backgroundColor: '#EF4444' },
  deleteConfirmText: { fontSize: 12, fontWeight: '800', color: '#fff' },
});
