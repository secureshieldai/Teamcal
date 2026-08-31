import React, { useState } from 'react';
import {
  Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing, typography } from '../../../theme';

interface Episode {
  id: string;
  title: string;
  episode: number;
}

interface Props {
  visible: boolean;
  episodes: Episode[];
  onClose: () => void;
  onConfirm: (config: ScheduleConfig) => void;
}

export interface ScheduleConfig {
  enabled: boolean;
  releaseMode?: 'immediate' | 'daily' | 'weekly' | 'custom' | 'viewer-based';
  scheduleType?: 'calendar' | 'viewer-based';
  firstReleaseDate?: string;
  firstReleaseTime?: string;
  timezone?: string;
  episodeSchedules?: Array<{ episodeId: string; releaseDate?: string; releaseTime?: string; viewerUnlockDay?: number }>;
  notifyOnRelease?: boolean;
}

const TIMEZONES = [
  'UTC', 'EST', 'CST', 'MST', 'PST', 'GMT', 'CET', 'IST', 'JST', 'AEST',
];

export default function ScheduleContentModal({ visible, episodes, onClose, onConfirm }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [releaseMode, setReleaseMode] = useState<'immediate' | 'daily' | 'weekly' | 'custom' | 'viewer-based'>('immediate');
  const [scheduleType, setScheduleType] = useState<'calendar' | 'viewer-based'>('calendar');
  const [firstReleaseDate, setFirstReleaseDate] = useState('');
  const [firstReleaseTime, setFirstReleaseTime] = useState('09:00');
  const [timezone, setTimezone] = useState('UTC');
  const [notifyOnRelease, setNotifyOnRelease] = useState(true);
  const [episodeSchedules, setEpisodeSchedules] = useState<Array<{
    episodeId: string;
    releaseDate?: string;
    releaseTime?: string;
    viewerUnlockDay?: number;
  }>>(episodes.map(ep => ({ episodeId: ep.id })));

  const handleEpisodeScheduleUpdate = (episodeId: string, field: string, value: string | number) => {
    setEpisodeSchedules(prev => prev.map(es =>
      es.episodeId === episodeId ? { ...es, [field]: value } : es
    ));
  };

  const generateSchedule = () => {
    if (!firstReleaseDate || releaseMode === 'immediate') return;

    const baseDate = new Date(firstReleaseDate);
    const updated = episodeSchedules.map((es, idx) => {
      const date = new Date(baseDate);
      if (releaseMode === 'daily') date.setDate(date.getDate() + idx);
      else if (releaseMode === 'weekly') date.setDate(date.getDate() + idx * 7);

      return {
        ...es,
        releaseDate: date.toISOString().split('T')[0],
        releaseTime: firstReleaseTime,
      };
    });
    setEpisodeSchedules(updated);
    Alert.alert('Success', `Generated ${releaseMode} schedule for all episodes`);
  };

  const handleConfirm = () => {
    if (enabled && !firstReleaseDate && releaseMode !== 'immediate') {
      Alert.alert('Error', 'Please select a first release date');
      return;
    }

    if (enabled && scheduleType === 'viewer-based') {
      const hasViewerDays = episodeSchedules.some(es => es.viewerUnlockDay !== undefined);
      if (!hasViewerDays) {
        Alert.alert('Error', 'Please set unlock days for viewer-based release');
        return;
      }
    }

    const config: ScheduleConfig = {
      enabled,
      releaseMode: enabled ? releaseMode : undefined,
      scheduleType: enabled ? scheduleType : undefined,
      firstReleaseDate: enabled && firstReleaseDate ? firstReleaseDate : undefined,
      firstReleaseTime: enabled ? firstReleaseTime : undefined,
      timezone: enabled ? timezone : undefined,
      episodeSchedules: enabled ? episodeSchedules : undefined,
      notifyOnRelease: enabled ? notifyOnRelease : undefined,
    };

    onConfirm(config);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={s.closeText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Schedule Content Release</Text>
          <TouchableOpacity onPress={handleConfirm}>
            <Text style={[s.doneText, !enabled && s.doneTextDisabled]}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <View style={[s.section, shadow.soft]}>
            <View style={s.sectionHeader}>
              <View>
                <Text style={s.sectionTitle}>Schedule Content Release</Text>
                <Text style={s.sectionDesc}>
                  Release videos gradually instead of making everything available immediately.
                </Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={setEnabled}
                trackColor={{ true: colors.primary, false: colors.border }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {enabled && (
            <>
              <View style={[s.section, shadow.soft]}>
                <Text style={s.sectionTitle}>Release Method</Text>

                {(['calendar', 'viewer-based'] as const).map(method => (
                  <TouchableOpacity
                    key={method}
                    style={s.methodOption}
                    onPress={() => setScheduleType(method)}
                  >
                    <View style={[s.radioOuter, scheduleType === method && s.radioOuterActive]}>
                      {scheduleType === method && <View style={s.radioInner} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.methodLabel}>
                        {method === 'calendar' ? 'Calendar-based' : 'Viewer-based'}
                      </Text>
                      <Text style={s.methodDesc}>
                        {method === 'calendar'
                          ? 'Videos become available to everyone on the same scheduled date'
                          : 'Videos unlock based on when viewers purchase or join'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={[s.section, shadow.soft]}>
                <Text style={s.sectionTitle}>Release Frequency</Text>

                {(['immediate', 'daily', 'weekly', 'custom'] as const).map(mode => (
                  <TouchableOpacity
                    key={mode}
                    style={s.modeOption}
                    onPress={() => setReleaseMode(mode)}
                  >
                    <View style={[s.radioOuter, releaseMode === mode && s.radioOuterActive]}>
                      {releaseMode === mode && <View style={s.radioInner} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.modeLabel}>
                        {mode === 'immediate' ? 'Release all immediately'
                          : mode === 'daily' ? 'One video per day'
                          : mode === 'weekly' ? 'One video per week'
                          : 'Custom schedule'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {releaseMode !== 'immediate' && (
                <>
                  <View style={[s.section, shadow.soft]}>
                    <Text style={s.sectionTitle}>First Release</Text>

                    <Text style={s.label}>Date</Text>
                    <TextInput
                      style={s.input}
                      placeholder="YYYY-MM-DD"
                      value={firstReleaseDate}
                      onChangeText={setFirstReleaseDate}
                    />

                    <Text style={s.label}>Time</Text>
                    <TextInput
                      style={s.input}
                      placeholder="HH:MM (24-hour format)"
                      value={firstReleaseTime}
                      onChangeText={setFirstReleaseTime}
                    />

                    <Text style={s.label}>Timezone</Text>
                    <View style={s.timezoneGrid}>
                      {TIMEZONES.map(tz => (
                        <TouchableOpacity
                          key={tz}
                          style={[s.tzBtn, timezone === tz && s.tzBtnActive]}
                          onPress={() => setTimezone(tz)}
                        >
                          <Text style={[s.tzBtnText, timezone === tz && s.tzBtnTextActive]}>{tz}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {(releaseMode === 'daily' || releaseMode === 'weekly') && (
                      <TouchableOpacity style={s.generateBtn} onPress={generateSchedule}>
                        <Ionicons name="refresh-outline" size={16} color={colors.primary} />
                        <Text style={s.generateBtnText}>
                          Generate {releaseMode === 'daily' ? 'Daily' : 'Weekly'} Schedule
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {scheduleType === 'calendar' && (
                    <View style={[s.section, shadow.soft]}>
                      <Text style={s.sectionTitle}>Episode Schedule</Text>
                      <Text style={s.sectionDesc}>Set individual release dates for each video.</Text>

                      {episodes.map((ep, idx) => {
                        const schedule = episodeSchedules[idx];
                        return (
                          <View key={ep.id} style={s.episodeCard}>
                            <Text style={s.episodeLabel}>Episode {ep.episode}: {ep.title}</Text>
                            <View style={s.episodeDateRow}>
                              <View style={{ flex: 1 }}>
                                <Text style={s.label}>Date</Text>
                                <TextInput
                                  style={s.input}
                                  placeholder="YYYY-MM-DD"
                                  value={schedule?.releaseDate || ''}
                                  onChangeText={(v) => handleEpisodeScheduleUpdate(ep.id, 'releaseDate', v)}
                                />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={s.label}>Time</Text>
                                <TextInput
                                  style={s.input}
                                  placeholder="HH:MM"
                                  value={schedule?.releaseTime || ''}
                                  onChangeText={(v) => handleEpisodeScheduleUpdate(ep.id, 'releaseTime', v)}
                                />
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {scheduleType === 'viewer-based' && (
                    <View style={[s.section, shadow.soft]}>
                      <Text style={s.sectionTitle}>Viewer Unlock Schedule</Text>
                      <Text style={s.sectionDesc}>
                        Set how many days after purchase each video unlocks for viewers.
                      </Text>

                      {episodes.map((ep, idx) => {
                        const schedule = episodeSchedules[idx];
                        return (
                          <View key={ep.id} style={s.episodeCard}>
                            <Text style={s.episodeLabel}>Episode {ep.episode}: {ep.title}</Text>
                            <Text style={s.label}>Unlock after (days)</Text>
                            <TextInput
                              style={s.input}
                              placeholder="0"
                              keyboardType="number-pad"
                              value={schedule?.viewerUnlockDay?.toString() || ''}
                              onChangeText={(v) => handleEpisodeScheduleUpdate(ep.id, 'viewerUnlockDay', v ? Number(v) : 0)}
                            />
                            <Text style={s.hint}>
                              {schedule?.viewerUnlockDay === 0 || schedule?.viewerUnlockDay === undefined
                                ? 'Available immediately'
                                : `Available ${schedule.viewerUnlockDay} day${schedule.viewerUnlockDay === 1 ? '' : 's'} after joining`}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </>
              )}

              <View style={[s.section, shadow.soft]}>
                <View style={s.toggleRow}>
                  <Text style={s.toggleLabel}>Notify viewers when new content releases</Text>
                  <Switch
                    value={notifyOnRelease}
                    onValueChange={setNotifyOnRelease}
                    trackColor={{ true: colors.primary, false: colors.border }}
                    thumbColor="#fff"
                  />
                </View>
              </View>

              <View style={[s.section, shadow.soft]}>
                <Text style={s.sectionTitle}>Schedule Summary</Text>
                <View style={s.summary}>
                  <SummaryRow label="Number of videos" value={episodes.length.toString()} />
                  <SummaryRow label="Release frequency" value={
                    releaseMode === 'immediate' ? 'All at once'
                      : releaseMode === 'daily' ? 'One per day'
                      : releaseMode === 'weekly' ? 'One per week'
                      : 'Custom dates'
                  } />
                  {firstReleaseDate && <SummaryRow label="First release" value={firstReleaseDate} />}
                  {releaseMode !== 'immediate' && <SummaryRow label="Timezone" value={timezone} />}
                  <SummaryRow label="Release method" value={scheduleType === 'calendar' ? 'Calendar-based' : 'Viewer-based'} />
                  <SummaryRow label="Notifications" value={notifyOnRelease ? 'Enabled' : 'Disabled'} />
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.summaryRow}>
      <Text style={s.summaryLabel}>{label}</Text>
      <Text style={s.summaryValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  headerTitle: { ...typography.h2, fontSize: 16 },
  doneText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  doneTextDisabled: { color: colors.textMuted, opacity: 0.5 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  section: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  sectionDesc: { fontSize: 11, color: colors.textSecondary, lineHeight: 16, marginTop: spacing.xs },
  label: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  methodOption: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  methodLabel: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  methodDesc: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  modeOption: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  modeLabel: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  radioOuterActive: { borderColor: colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  timezoneGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  tzBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  tzBtnActive: { borderColor: colors.primary, backgroundColor: '#FFF8F5' },
  tzBtnText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  tzBtnTextActive: { color: colors.primary },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderWidth: 1.5, borderColor: colors.primary, borderRadius: radii.lg, paddingVertical: spacing.md, backgroundColor: '#FFF8F5', marginTop: spacing.md },
  generateBtnText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  episodeCard: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  episodeLabel: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
  episodeDateRow: { flexDirection: 'row', gap: spacing.md },
  hint: { fontSize: 10, color: colors.textMuted, marginTop: spacing.xs },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleLabel: { fontSize: 13, color: colors.textPrimary, fontWeight: '600', flex: 1 },
  summary: { backgroundColor: colors.background, borderRadius: radii.lg, padding: spacing.lg, gap: spacing.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  summaryLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  summaryValue: { fontSize: 12, fontWeight: '600', color: colors.textPrimary, textAlign: 'right' },
});
