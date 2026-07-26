import React, { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api/auth.service';
import { notificationsService, type NotificationPrefs } from '../services/api/notifications.service';
import { userService } from '../services/api/user.service';
import { colors, radii, spacing, typography } from '../theme';

function Page({ title, children }: { title: string; children: React.ReactNode }) {
  const navigation = useNavigation();
  return <SafeAreaView style={s.safe}><View style={s.header}>
    <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={24} color={colors.textPrimary} /></TouchableOpacity>
    <Text style={s.title}>{title}</Text><View style={{ width: 24 }} />
  </View><ScrollView contentContainerStyle={s.content}>{children}</ScrollView></SafeAreaView>;
}

function Button({ label, onPress, busy }: { label: string; onPress: () => void; busy?: boolean }) {
  return <TouchableOpacity style={[s.button, busy && s.disabled]} onPress={onPress} disabled={busy}>
    <Text style={s.buttonText}>{busy ? 'Saving…' : label}</Text>
  </TouchableOpacity>;
}

export function EditProfileScreen() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [busy, setBusy] = useState(false);
  const save = async () => { try { setBusy(true); await userService.updateProfile({ name: name.trim(), bio: bio.trim(), avatar: avatar.trim() || null as never }); await refreshUser(); Alert.alert('Saved', 'Your profile has been updated.'); } catch (e) { Alert.alert('Unable to save', (e as Error).message); } finally { setBusy(false); } };
  return <Page title="Edit Profile"><Text style={s.label}>Name</Text><TextInput style={s.input} value={name} onChangeText={setName} />
    <Text style={s.label}>Bio</Text><TextInput style={[s.input, s.multiline]} value={bio} onChangeText={setBio} multiline maxLength={240} />
    <Text style={s.label}>Avatar URL</Text><TextInput style={s.input} value={avatar} onChangeText={setAvatar} autoCapitalize="none" keyboardType="url" />
    <Button label="Save Profile" onPress={save} busy={busy} /></Page>;
}

export function ChangePasswordScreen() {
  const [current, setCurrent] = useState(''); const [next, setNext] = useState(''); const [confirm, setConfirm] = useState(''); const [busy, setBusy] = useState(false);
  const save = async () => { if (next.length < 6) return Alert.alert('Invalid password', 'Use at least 6 characters.'); if (next !== confirm) return Alert.alert('Passwords do not match'); try { setBusy(true); await authService.changePassword(current, next); setCurrent(''); setNext(''); setConfirm(''); Alert.alert('Updated', 'Your password was changed.'); } catch (e) { Alert.alert('Unable to change password', (e as Error).message); } finally { setBusy(false); } };
  return <Page title="Change Password">{[['Current password', current, setCurrent], ['New password', next, setNext], ['Confirm new password', confirm, setConfirm]].map(([label, value, setter]) => <View key={label as string}><Text style={s.label}>{label as string}</Text><TextInput style={s.input} value={value as string} onChangeText={setter as (v: string) => void} secureTextEntry /></View>)}<Button label="Update Password" onPress={save} busy={busy} /></Page>;
}

const prefLabels: Record<keyof NotificationPrefs, string> = { milestones: 'Milestones', streaks: 'Streak reminders', hydration: 'Hydration reminders', insights: 'Health insights', contests: 'Challenges and contests', social: 'Social activity', commerce: 'Marketplace', updates: 'Product updates' };
export function NotificationSettingsScreen() {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  useEffect(() => { notificationsService.getPrefs().then(setPrefs).catch(e => Alert.alert('Unable to load preferences', e.message)); }, []);
  const toggle = async (key: keyof NotificationPrefs, value: boolean) => { if (!prefs) return; const previous = prefs; setPrefs({ ...prefs, [key]: value }); try { setPrefs(await notificationsService.updatePrefs({ [key]: value })); } catch (e) { setPrefs(previous); Alert.alert('Unable to save', (e as Error).message); } };
  return <Page title="Notifications">{prefs ? Object.keys(prefLabels).map(key => <View style={s.row} key={key}><Text style={s.rowText}>{prefLabels[key as keyof NotificationPrefs]}</Text><Switch value={prefs[key as keyof NotificationPrefs]} onValueChange={v => toggle(key as keyof NotificationPrefs, v)} trackColor={{ true: colors.primary }} /></View>) : <Text style={s.muted}>Loading preferences…</Text>}</Page>;
}

export function PrivacyScreen() {
  const [dmEnabled, setDmEnabled] = useState(true); const [busy, setBusy] = useState(false);
  const save = async () => { try { setBusy(true); await userService.updateProfile({ dm_enabled: dmEnabled }); Alert.alert('Saved', 'Privacy preferences updated.'); } catch (e) { Alert.alert('Unable to save', (e as Error).message); } finally { setBusy(false); } };
  return <Page title="Privacy"><View style={s.row}><View style={{ flex: 1 }}><Text style={s.rowText}>Direct messages</Text><Text style={s.muted}>Allow other members to message you</Text></View><Switch value={dmEnabled} onValueChange={setDmEnabled} trackColor={{ true: colors.primary }} /></View><Button label="Save Privacy Settings" onPress={save} busy={busy} /></Page>;
}

export function HelpSupportScreen() {
  return <Page title="Help & Support"><Text style={s.section}>How can we help?</Text><Text style={s.muted}>For account, sign-in, billing, or technical issues, contact the TeamCal support team.</Text>
    <TouchableOpacity style={s.supportCard} onPress={() => Linking.openURL('mailto:support@teamcal.app?subject=TeamCal%20Support')}><Ionicons name="mail-outline" size={22} color={colors.primary} /><View><Text style={s.rowText}>Email support</Text><Text style={s.muted}>support@teamcal.app</Text></View></TouchableOpacity>
    <Text style={s.section}>Common questions</Text>{['How do I update my profile?', 'How do notifications work?', 'How is my health data protected?'].map(x => <View style={s.faq} key={x}><Text style={s.rowText}>{x}</Text><Ionicons name="chevron-forward" size={18} color={colors.textMuted} /></View>)}</Page>;
}

const s = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.background }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg }, title: { ...typography.h2, color: colors.textPrimary }, content: { padding: spacing.lg, paddingBottom: 40 }, label: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm, marginTop: spacing.md }, input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.md, color: colors.textPrimary }, multiline: { minHeight: 100, textAlignVertical: 'top' }, button: { marginTop: spacing.xl, backgroundColor: colors.primary, borderRadius: radii.pill, padding: spacing.md, alignItems: 'center' }, buttonText: { color: colors.white, fontWeight: '700' }, disabled: { opacity: .55 }, row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border }, rowText: { flex: 1, ...typography.bodyBold, color: colors.textPrimary }, muted: { ...typography.caption, color: colors.textSecondary, lineHeight: 19 }, section: { ...typography.h2, color: colors.textPrimary, marginTop: spacing.md, marginBottom: spacing.sm }, supportCard: { flexDirection: 'row', gap: spacing.md, alignItems: 'center', backgroundColor: colors.card, padding: spacing.lg, borderRadius: radii.lg, marginTop: spacing.lg }, faq: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border } });
