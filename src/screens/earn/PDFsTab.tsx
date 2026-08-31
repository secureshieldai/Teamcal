import React, { useMemo, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

export default function PDFsTab({ navigation }: Props) {
  const [range, setRange] = useState<DateRangeKey>('30d');
  const [showArchived, setShowArchived] = useState(false);
  const userAssets=useEarnAssets('pdf');
  const activePdfs = userAssets.assets.filter(p=>p.status!=='archived');
  const archivedPdfs = userAssets.assets.filter(p=>p.status==='archived');

  const metric=(asset:(typeof userAssets.assets)[number],key:string)=>Number(asset.metrics?.[range==='lifetime'||range==='custom'?key:`${range}_${key}`]??asset.metrics?.[key]??0);

  const totals = useMemo(
    () => ({
      count: activePdfs.length,
      previewViews: activePdfs.reduce((s, p) => s + metric(p,'views'), 0),
      purchases: activePdfs.reduce((s, p) => s + metric(p,'purchases'), 0),
      readers: activePdfs.reduce((s, p) => s + metric(p,'readers'), 0),
      earnings: activePdfs.reduce((s, p) => s + metric(p,'earned'), 0),
      downloads: activePdfs.reduce((s, p) => s + metric(p,'downloads'), 0),
      conversion: activePdfs.reduce((s, p) => s + metric(p,'views'), 0)
        ? activePdfs.reduce((s, p) => s + metric(p,'purchases'), 0) / activePdfs.reduce((s, p) => s + metric(p,'views'), 0) * 100
        : 0,
    }),
    [activePdfs,range]
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

      <View style={styles.createRow}>
        <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate('CreatePdf')} activeOpacity={0.85}>
          <Ionicons name="document-text-outline" size={20} color={colors.white} />
          <Text style={styles.createBtnText}>Create a PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.uploadBtn} onPress={() => navigation.navigate('UploadPdf')} activeOpacity={0.85}>
          <Ionicons name="cloud-upload-outline" size={20} color={colors.primary} />
          <Text style={styles.uploadBtnText}>Upload a PDF</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Your PDFs</Text>
      </View>
      {userAssets.error?<Text style={styles.itemMeta}>Could not load your PDFs: {userAssets.error}</Text>:null}
      <View style={{ gap: spacing.md }}>
        {activePdfs.map((pdf)=>{const views=Number(pdf.metrics?.views||0),purchases=Number(pdf.metrics?.purchases||0);return (
          <TouchableOpacity key={pdf.id} style={[styles.itemCard,shadow.soft]} onPress={()=>navigation.navigate('PdfDashboard',{pdfId:pdf.id})} activeOpacity={0.85}>
            <Image source={{uri:pdf.image||`https://picsum.photos/seed/${pdf.id}/300/400`}} style={styles.pdfCover}/>
            <View style={{flex:1}}><View style={styles.itemTopRow}><Text style={styles.itemName} numberOfLines={1}>{pdf.title}</Text><StatusBadge status={pdf.status}/></View><Text style={styles.itemMeta}>{String(pdf.metadata?.author||'Creator')} · {String(pdf.metadata?.category||pdf.subtype)} · {pdf.currency} {Number(pdf.price).toFixed(2)}</Text><View style={styles.itemStatsRow}><Text style={styles.itemStat}>{views} previews</Text><Text style={styles.itemStat}>{purchases} purchases</Text><Text style={styles.itemStat}>{views?(purchases/views*100).toFixed(1):'0.0'}%</Text><Text style={styles.itemStat}>${pdf.metrics?.earned||0}</Text><Text style={styles.itemStat}>★ {Number(pdf.metrics?.rating||0).toFixed(1)}</Text></View><Text style={styles.itemMeta}>Published {new Date(pdf.created_at).toLocaleDateString()}</Text></View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted}/>
          </TouchableOpacity>
        );})}
        {!userAssets.loading&&!activePdfs.length?<Text style={styles.itemMeta}>No personal PDFs yet. Create one above.</Text>:null}
      </View>

      {archivedPdfs.length>0 && (
        <View style={{marginTop:spacing.xl}}>
          <TouchableOpacity style={styles.sectionHeaderRow} onPress={()=>setShowArchived(v=>!v)}>
            <Text style={styles.sectionTitle}>Archived PDFs ({archivedPdfs.length})</Text>
            <Ionicons name={showArchived?'chevron-up':'chevron-down'} size={18} color={colors.textSecondary}/>
          </TouchableOpacity>
          {showArchived && (
            <View style={{ gap: spacing.md }}>
              {archivedPdfs.map(pdf=>(
                <View key={pdf.id} style={[styles.itemCard,shadow.soft,{opacity:0.7}]}>
                  <TouchableOpacity style={{flex:1,flexDirection:'row',gap:spacing.md,alignItems:'center'}} onPress={()=>navigation.navigate('PdfDashboard',{pdfId:pdf.id})}>
                    <Image source={{uri:pdf.image||`https://picsum.photos/seed/${pdf.id}/300/400`}} style={styles.pdfCover}/>
                    <View style={{flex:1}}><Text style={styles.itemName} numberOfLines={1}>{pdf.title}</Text><Text style={styles.itemMeta}>Archived · {String(pdf.metadata?.category||pdf.subtype)}</Text></View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.restoreBtn} onPress={async()=>{try{await userAssets.update(pdf.id,{status:'draft'});}catch(e){Alert.alert('Error',(e as Error).message);}}}>
                    <Text style={styles.restoreBtnText}>Restore</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
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
  createRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  createBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radii.xl, paddingVertical: spacing.lg },
  createBtnText: { fontSize: 14, fontWeight: '800', color: colors.white },
  uploadBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radii.xl, paddingVertical: spacing.lg, borderWidth: 1.5, borderColor: colors.primary },
  uploadBtnText: { fontSize: 14, fontWeight: '800', color: colors.primary },
  itemCard: { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md, alignItems: 'center' },
  deleteBtn: { padding: spacing.xs },
  restoreBtn: { borderWidth: 1, borderColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  restoreBtnText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  pdfCover: { width: 52, height: 68, borderRadius: radii.md, backgroundColor: colors.border },
  itemTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  itemName: { fontSize: 13.5, fontWeight: '800', color: colors.textPrimary, flexShrink: 1 },
  itemMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  itemStatsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  itemStat: { fontSize: 10.5, color: colors.textSecondary, fontWeight: '600' },
});
