import React, { useEffect, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing } from '../../theme';
import { connectStepSource, disconnectStepSource, getStepConnections, openStepSourcePermissions, syncStepSource, type StepConnections, type StepSourceId } from '../../services/stepSync';

type Props = { onSynced: () => Promise<void> };
const time = (value?: number) => value ? new Date(value).toLocaleString([], { hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric' }) : 'Not synced yet';

export default function ConnectedSourcesCard({ onSynced }: Props) {
  const [connections, setConnections] = useState<StepConnections>({});
  const [busy, setBusy] = useState<StepSourceId | null>(null);
  const [picker, setPicker] = useState(false);
  const load = async () => setConnections(await getStepConnections());
  useEffect(() => { load(); }, []);
  const run = async (source: StepSourceId, connect = false) => {
    setBusy(source);
    try { await (connect ? connectStepSource(source) : syncStepSource(source)); await load(); await onSynced(); }
    catch (error) { await load(); Alert.alert('Connection failed', (error as Error).message, [{ text: 'Cancel', style: 'cancel' }, { text: 'Try Again', onPress: () => run(source, true) }]); }
    finally { setBusy(null); }
  };
  const disconnect = (source: StepSourceId) => Alert.alert('Disconnect source?', 'Imported history will remain, but future automatic syncs will stop.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Disconnect', style: 'destructive', onPress: async () => { await disconnectStepSource(source); await load(); } }]);
  const row = (source: StepSourceId, label: string, icon: keyof typeof Ionicons.glyphMap, available = true, onConnect?: () => void) => {
    const state = connections[source]; const connected = !!state?.connected;
    return <View style={s.row} key={source}><TouchableOpacity style={s.main} disabled={!available || busy === source} onPress={() => connected ? null : (onConnect ? onConnect() : run(source, true))}>
      <View style={s.icon}><Ionicons name={icon} size={19} color={colors.textSecondary} /></View><View style={s.copy}><Text style={s.name}>{label}</Text><Text style={[s.status, connected && s.connected]}>{busy === source ? 'Connecting…' : connected ? '● Connected' : state?.error ? 'Connection failed · Try Again' : available ? 'Connect' : 'iOS only'}</Text>{connected && <Text style={s.synced}>Last sync: {time(state?.lastSyncedAt)}</Text>}</View><Ionicons name="chevron-forward" size={18} color={colors.textMuted} /></TouchableOpacity>
      {connected && <View style={s.actions}><TouchableOpacity onPress={() => run(source)}><Text style={s.action}>Sync Now</Text></TouchableOpacity><TouchableOpacity onPress={() => openStepSourcePermissions(source)}><Text style={s.action}>Manage Permissions</Text></TouchableOpacity><TouchableOpacity onPress={() => disconnect(source)}><Text style={[s.action, s.danger]}>Disconnect</Text></TouchableOpacity></View>}
    </View>;
  };
  return <View style={[s.card, shadow.card]}><Text style={s.heading}>CONNECTED SOURCES</Text>{row('phone-motion', 'Phone Motion', 'phone-portrait-outline')}{Platform.OS === 'ios' && row('apple-health', 'Apple Watch', 'watch-outline')}{row('health-connect', 'Fitness Tracker', 'pulse-outline', true, () => setPicker(true))}
    <Modal visible={picker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPicker(false)}><View style={s.modal}><View style={s.modalHeader}><Text style={s.modalTitle}>Choose a fitness service</Text><TouchableOpacity onPress={() => setPicker(false)}><Ionicons name="close" size={25} /></TouchableOpacity></View><ScrollView>
      <Provider name="Google Health Connect" detail="Connect apps and devices that write to Health Connect." onPress={() => { setPicker(false); run('health-connect', true); }} />
      <Provider name="Samsung Health" detail="Share Samsung Health data through Health Connect." onPress={() => { setPicker(false); run('health-connect', true); }} />
      <Provider name="Fitbit" detail="Fitbit can share supported data through Health Connect." onPress={() => Alert.alert('Connect Fitbit through Health Connect', 'In Fitbit, enable Health Connect sharing, then connect Google Health Connect here.')} />
      <Provider name="Garmin" detail="Garmin requires a Garmin Health partner connection." onPress={() => Alert.alert('Garmin authorization unavailable', 'This build has no Garmin Health partner credentials configured. No account data was requested or stored.')} />
      <Provider name="Other integrations" detail="Any app that writes activity data to Health Connect is supported." onPress={() => { setPicker(false); run('health-connect', true); }} />
    </ScrollView></View></Modal>
  </View>;
}
function Provider({ name, detail, onPress }: { name: string; detail: string; onPress: () => void }) { return <TouchableOpacity style={s.provider} onPress={onPress}><View style={s.providerIcon}><Ionicons name="fitness-outline" size={21} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={s.providerName}>{name}</Text><Text style={s.providerDetail}>{detail}</Text></View><Ionicons name="chevron-forward" size={18} color={colors.textMuted} /></TouchableOpacity>; }
const s = StyleSheet.create({ card: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg }, heading: { fontSize: 11.5, fontWeight: '700', color: colors.textMuted, letterSpacing: .5 }, row: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md }, main: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, icon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1 }, name: { fontSize: 13.5, fontWeight: '700', color: colors.textPrimary }, status: { fontSize: 11.5, color: colors.textMuted, marginTop: 2 }, connected: { color: colors.success, fontWeight: '700' }, synced: { fontSize: 10.5, color: colors.textSecondary, marginTop: 2 }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, paddingLeft: 42, paddingTop: spacing.sm }, action: { color: colors.primary, fontSize: 11.5, fontWeight: '700' }, danger: { color: '#D94B4B' }, modal: { flex: 1, backgroundColor: colors.background, paddingTop: spacing.xl }, modalHeader: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg }, modalTitle: { flex: 1, fontSize: 20, fontWeight: '800' }, provider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border }, providerIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF3EC', alignItems: 'center', justifyContent: 'center' }, providerName: { fontSize: 14, fontWeight: '800' }, providerDetail: { fontSize: 11.5, color: colors.textSecondary, lineHeight: 17, marginTop: 2 } });
