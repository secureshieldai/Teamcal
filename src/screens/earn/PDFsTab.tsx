import React, { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import StatCard from './components/StatCard';
import DateRangeDropdown from './components/DateRangeDropdown';
import StatusBadge from './components/StatusBadge';
import { colors, radii, shadow, spacing, typography } from '../../theme';
import { type DateRangeKey } from '../../data/earnData';
import type { RootStackParamList } from '../../navigation/types';
import { useEarnAssets } from '../../hooks/useEarnAssets';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList> };

const UPLOAD_OPTIONS = [
  { key: 'upload', label: 'Upload an existing PDF', icon: 'cloud-upload-outline' },
  { key: 'create', label: 'Create inside the app', icon: 'document-outline' },
  { key: 'ai', label: 'Generate using AI', icon: 'sparkles-outline' },
  { key: 'import', label: 'Import a document', icon: 'download-outline' },
  { key: 'blog', label: 'Convert a blog post', icon: 'newspaper-outline' },
  { key: 'combine', label: 'Combine blog posts', icon: 'copy-outline' },
  { key: 'manuscript', label: 'Format a manuscript', icon: 'book-outline' },
] as const;

export default function PDFsTab({ navigation }: Props) {
  const [range, setRange] = useState<DateRangeKey>('30d');
  const userAssets=useEarnAssets('pdf');

  const metric=(asset:(typeof userAssets.assets)[number],key:string)=>Number(asset.metrics?.[range==='lifetime'||range==='custom'?key:`${range}_${key}`]??asset.metrics?.[key]??0);

  const totals = useMemo(
    () => ({
      count: userAssets.assets.length,
      previewViews: userAssets.assets.reduce((s, p) => s + metric(p,'views'), 0),
      purchases: userAssets.assets.reduce((s, p) => s + metric(p,'purchases'), 0),
      readers: userAssets.assets.reduce((s, p) => s + metric(p,'readers'), 0),
      earnings: userAssets.assets.reduce((s, p) => s + metric(p,'earned'), 0),
      downloads: userAssets.assets.reduce((s, p) => s + metric(p,'downloads'), 0),
      conversion: userAssets.assets.reduce((s, p) => s + metric(p,'views'), 0)
        ? userAssets.assets.reduce((s, p) => s + metric(p,'purchases'), 0) / userAssets.assets.reduce((s, p) => s + metric(p,'views'), 0) * 100
        : 0,
    }),
    [userAssets.assets,range]
  );

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Earn with PDFs</Text>
          <Text style={styles.subtitle}>Upload books, guides and digital resources, offer a free preview and earn from every purchase.</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.audienceEngineBtn} onPress={() => navigation.navigate('AudienceEngine', { sourceLabel: 'PDFs' })} activeOpacity={0.85}>
        <Ionicons name="people-circle-outline" size={16} color={colors.white} />
        <Text style={styles.audienceEngineBtnText}>Audience Engine</Text>
      </TouchableOpacity>

      <View style={styles.statsGrid}>
        <StatCard label="Total PDFs" value={String(totals.count)} icon="book-outline" />
        <StatCard label="Preview Views" value={totals.previewViews.toLocaleString()} icon="eye-outline" />
        <StatCard label="Full Purchases" value={totals.purchases.toLocaleString()} icon="cart-outline" />
        <StatCard label="Total Earnings" value={`$${totals.earnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon="cash-outline" />
        <StatCard label="Conversion Rate" value={`${totals.conversion.toFixed(2)}%`} icon="trending-up-outline" />
        <StatCard label="Total Readers" value={totals.readers.toLocaleString()} icon="people-outline" />
        <StatCard label="Downloads" value={totals.downloads.toLocaleString()} icon="download-outline" />
      </View>

      <View style={{ marginTop: spacing.lg }}>
        <DateRangeDropdown value={range} onChange={setRange} />
      </View>

      <TouchableOpacity style={styles.createCard} onPress={() => navigation.navigate('PdfEditor',{mode:'upload'})}>
        <View style={{flex:1}}><Text style={styles.createTitle}>Upload or Create a PDF</Text><Text style={styles.createSubtitle}>Publish a book, guide or digital resource</Text></View><Ionicons name="add-circle" size={30} color={colors.white}/>
      </TouchableOpacity>
      <View style={styles.optionsGrid}>
        {UPLOAD_OPTIONS.map((opt) => (
          <TouchableOpacity key={opt.key} style={styles.optionItem} onPress={() => navigation.navigate('PdfEditor',{mode:opt.key})}>
            <View style={styles.optionIcon}>
              <Ionicons name={opt.icon as keyof typeof Ionicons.glyphMap} size={18} color={colors.primary} />
            </View>
            <Text style={styles.optionLabel}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Your PDFs</Text>
      </View>
      {userAssets.error?<Text style={styles.itemMeta}>Could not load your PDFs: {userAssets.error}</Text>:null}
      <View style={{ gap: spacing.md }}>
        {userAssets.assets.map((pdf)=>{const views=Number(pdf.metrics?.views||0),purchases=Number(pdf.metrics?.purchases||0);return <TouchableOpacity key={pdf.id} style={[styles.itemCard,shadow.soft]} onPress={()=>navigation.navigate('PdfDashboard',{pdfId:pdf.id})}><Image source={{uri:pdf.image||`https://picsum.photos/seed/${pdf.id}/300/400`}} style={styles.pdfCover}/><View style={{flex:1}}><View style={styles.itemTopRow}><Text style={styles.itemName} numberOfLines={1}>{pdf.title}</Text><StatusBadge status={pdf.status}/></View><Text style={styles.itemMeta}>{String(pdf.metadata?.author||'Creator')} · {String(pdf.metadata?.category||pdf.subtype)} · {pdf.currency} {Number(pdf.price).toFixed(2)}</Text><View style={styles.itemStatsRow}><Text style={styles.itemStat}>{views} previews</Text><Text style={styles.itemStat}>{purchases} purchases</Text><Text style={styles.itemStat}>{views?(purchases/views*100).toFixed(1):'0.0'}%</Text><Text style={styles.itemStat}>${pdf.metrics?.earned||0}</Text><Text style={styles.itemStat}>★ {Number(pdf.metrics?.rating||0).toFixed(1)}</Text></View><Text style={styles.itemMeta}>Published {new Date(pdf.created_at).toLocaleDateString()}</Text></View><Ionicons name="chevron-forward" size={18} color={colors.textMuted}/></TouchableOpacity>})}
        {!userAssets.loading&&!userAssets.assets.length?<Text style={styles.itemMeta}>No personal PDFs yet. Create one above.</Text>:null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  headerRow: { flexDirection: 'row' },
  title: { ...typography.h2, fontSize: 18, color: colors.textPrimary },
  subtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 4, lineHeight: 17 },
  audienceEngineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.navy,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  audienceEngineBtnText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  sectionTitle: { ...typography.h2, fontSize: 15, color: colors.textPrimary, marginTop: spacing.xl, marginBottom: spacing.md },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xl, marginBottom: spacing.md },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  createCard:{marginTop:spacing.xl,backgroundColor:colors.primary,borderRadius:radii.xl,padding:spacing.lg,flexDirection:'row',alignItems:'center'},
  createTitle:{fontSize:16,fontWeight:'800',color:colors.white},
  createSubtitle:{fontSize:11,color:'rgba(255,255,255,.85)',marginTop:3},
  optionItem: { width: '31%', backgroundColor: colors.card, borderRadius: radii.lg, paddingVertical: spacing.md, alignItems: 'center' },
  optionIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFEDE3', alignItems: 'center', justifyContent: 'center' },
  optionLabel: { fontSize: 10, fontWeight: '700', color: colors.textPrimary, marginTop: 6, textAlign: 'center' },
  itemCard: { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md },
  pdfCover: { width: 52, height: 68, borderRadius: radii.md, backgroundColor: colors.border },
  itemTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  itemName: { fontSize: 13.5, fontWeight: '800', color: colors.textPrimary, flexShrink: 1 },
  itemMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  itemStatsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  itemStat: { fontSize: 10.5, color: colors.textSecondary, fontWeight: '600' },
});
