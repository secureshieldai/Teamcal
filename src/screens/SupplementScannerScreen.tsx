import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radii, shadow, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import { supplementScannerService, type SafetyFlag, type ScannedSupplement, type ScanHistoryItem } from '../services/api/supplement-scanner.service';
import { useSupplements } from '../hooks/useSupplements';
import { TIME_OF_DAY_META, type TimeOfDay } from '../data/supplementData';

// ─── Types ──────────────────────────────────────────────────────────────────

type CaptureStep = 'frontLabel' | 'factsPanel' | 'barcode' | 'expiryArea';
type ScreenTab = 'scan' | 'history';

const CAPTURE_STEPS: { key: CaptureStep; label: string; hint: string; icon: string }[] = [
  { key: 'frontLabel', label: 'Front Label', hint: 'Capture the full front of the product', icon: 'image-outline' },
  { key: 'factsPanel', label: 'Supplement Facts', hint: 'Capture the Supplement Facts panel', icon: 'list-outline' },
  { key: 'barcode', label: 'Barcode', hint: 'Optional — capture the barcode', icon: 'barcode-outline' },
  { key: 'expiryArea', label: 'Expiry Date', hint: 'Optional — capture the expiry date area', icon: 'calendar-outline' },
];

const SEVERITY_COLORS: Record<SafetyFlag['severity'], string> = {
  info: '#3E7BFA',
  warning: '#FFC542',
  danger: '#FF4D5E',
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function SupplementScannerScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { supplements, add } = useSupplements();
  const [tab, setTab] = useState<ScreenTab>('scan');

  // Scan state
  const [captures, setCaptures] = useState<Partial<Record<CaptureStep, string>>>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [scanned, setScanned] = useState<ScannedSupplement | null>(null);
  const [safetyFlags, setSafetyFlags] = useState<SafetyFlag[]>([]);
  const [safetyChecking, setSafetyChecking] = useState(false);
  const [medicationInput, setMedicationInput] = useState('');
  const [medications, setMedications] = useState<string[]>([]);
  const [showMedModal, setShowMedModal] = useState(false);
  const [step, setStep] = useState<'capture' | 'review' | 'safety' | 'schedule'>('capture');

  // Review edits
  const [editName, setEditName] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editDose, setEditDose] = useState('');
  const [editTimeOfDay, setEditTimeOfDay] = useState<TimeOfDay>('morning');
  const [editWithFood, setEditWithFood] = useState(false);
  const [editReminderTime, setEditReminderTime] = useState('08:00');
  const [editRefillDays, setEditRefillDays] = useState('30');
  const [saving, setSaving] = useState(false);

  // History
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const hasFrontLabel = !!captures.frontLabel;
  const hasFactsPanel = !!captures.factsPanel;
  const canAnalyze = hasFrontLabel || hasFactsPanel;

  // ── Capture ─────────────────────────────────────────────────────────────

  const captureImage = useCallback(async (stepKey: CaptureStep) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera permission required', 'Please allow camera access to scan supplements.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      base64: false,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setCaptures((prev) => ({ ...prev, [stepKey]: result.assets[0].uri }));
    }
  }, []);

  const pickFromLibrary = useCallback(async (stepKey: CaptureStep) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.85,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setCaptures((prev) => ({ ...prev, [stepKey]: result.assets[0].uri }));
    }
  }, []);

  // ── Analyze ─────────────────────────────────────────────────────────────

  const analyze = useCallback(async () => {
    if (!canAnalyze) return;
    setAnalyzing(true);
    try {
      const result = await supplementScannerService.analyzeImages(captures);
      await supplementScannerService.saveToHistory(result);
      setScanned(result);
      // Pre-fill review fields
      setEditName(result.name);
      setEditBrand(result.brand);
      setEditDose(result.servingSize);
      setEditTimeOfDay(result.suggestedTimeOfDay);
      setEditWithFood(result.suggestedWithFood);
      setEditReminderTime(result.suggestedTimeOfDay === 'morning' ? '08:00' : result.suggestedTimeOfDay === 'midday' ? '12:00' : result.suggestedTimeOfDay === 'evening' ? '18:00' : '21:00');
      setEditRefillDays(String(result.servingsPerContainer || 30));
      setStep('review');
    } catch (e) {
      Alert.alert(
        'Could not read the label',
        'The image may be unclear. Please try again or enter the details manually.',
        [{ text: 'OK' }]
      );
    } finally {
      setAnalyzing(false);
    }
  }, [captures, canAnalyze]);

  // ── Safety check ─────────────────────────────────────────────────────────

  const runSafetyCheck = useCallback(async () => {
    if (!scanned) return;
    setSafetyChecking(true);
    setStep('safety');
    try {
      const flags = await supplementScannerService.checkSafety(
        scanned,
        supplements.map((s) => s.id),
        medications
      );
      setSafetyFlags(flags);
    } catch {
      setSafetyFlags([]);
    } finally {
      setSafetyChecking(false);
    }
  }, [scanned, supplements, medications]);

  // ── Add to stack ─────────────────────────────────────────────────────────

  const addToStack = useCallback(async () => {
    setSaving(true);
    try {
      await add({
        name: editName.trim() || scanned?.name || '',
        dose: editDose.trim(),
        timeOfDay: editTimeOfDay,
        reminderTime: editReminderTime,
        takeWithFood: editWithFood,
        refillDays: Number(editRefillDays) || 30,
        costUsd: 0,
      });
      Alert.alert('Added!', `${editName} has been added to your supplement stack.`, [
        { text: 'Great', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [editName, editDose, editTimeOfDay, editReminderTime, editWithFood, editRefillDays, scanned, add, navigation]);

  // ── History ──────────────────────────────────────────────────────────────

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const items = await supplementScannerService.getHistory();
      setHistory(items);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'history') loadHistory();
  }, [tab, loadHistory]);

  const useFromHistory = useCallback((item: ScanHistoryItem) => {
    const r = item.result;
    setScanned(r);
    setEditName(r.name);
    setEditBrand(r.brand);
    setEditDose(r.servingSize);
    setEditTimeOfDay(r.suggestedTimeOfDay);
    setEditWithFood(r.suggestedWithFood);
    setEditReminderTime(r.suggestedTimeOfDay === 'morning' ? '08:00' : r.suggestedTimeOfDay === 'midday' ? '12:00' : r.suggestedTimeOfDay === 'evening' ? '18:00' : '21:00');
    setEditRefillDays(String(r.servingsPerContainer || 30));
    setTab('scan');
    setStep('review');
  }, []);

  // ── Reset ────────────────────────────────────────────────────────────────

  const reset = () => {
    setCaptures({});
    setScanned(null);
    setSafetyFlags([]);
    setMedications([]);
    setStep('capture');
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={styles.title}>AI Supplement Scanner</Text>
          <Text style={styles.subtitle}>Scan & analyse your supplements</Text>
        </View>
        {step !== 'capture' && (
          <TouchableOpacity onPress={reset} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="refresh-outline" size={21} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['scan', 'history'] as ScreenTab[]).map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t === 'scan' ? 'Scanner' : 'History'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'history' ? (
        <HistoryTab history={history} loading={historyLoading} onUse={useFromHistory} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {step === 'capture' && (
            <CaptureStep
              captures={captures}
              onCapture={captureImage}
              onPick={pickFromLibrary}
              canAnalyze={canAnalyze}
              analyzing={analyzing}
              onAnalyze={analyze}
            />
          )}
          {step === 'review' && scanned && (
            <ReviewStep
              scanned={scanned}
              editName={editName} setEditName={setEditName}
              editBrand={editBrand} setEditBrand={setEditBrand}
              editDose={editDose} setEditDose={setEditDose}
              editTimeOfDay={editTimeOfDay} setEditTimeOfDay={setEditTimeOfDay}
              editWithFood={editWithFood} setEditWithFood={setEditWithFood}
              editReminderTime={editReminderTime} setEditReminderTime={setEditReminderTime}
              editRefillDays={editRefillDays} setEditRefillDays={setEditRefillDays}
              onNext={runSafetyCheck}
              showMedModal={showMedModal}
              setShowMedModal={setShowMedModal}
              medications={medications}
              setMedications={setMedications}
              medicationInput={medicationInput}
              setMedicationInput={setMedicationInput}
            />
          )}
          {step === 'safety' && (
            <SafetyStep
              flags={safetyFlags}
              checking={safetyChecking}
              onContinue={() => setStep('schedule')}
            />
          )}
          {step === 'schedule' && scanned && (
            <ScheduleStep
              scanned={scanned}
              editName={editName}
              editTimeOfDay={editTimeOfDay} setEditTimeOfDay={setEditTimeOfDay}
              editWithFood={editWithFood} setEditWithFood={setEditWithFood}
              editReminderTime={editReminderTime} setEditReminderTime={setEditReminderTime}
              editRefillDays={editRefillDays} setEditRefillDays={setEditRefillDays}
              saving={saving}
              onAdd={addToStack}
            />
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Step: Capture ────────────────────────────────────────────────────────────

function CaptureStep({ captures, onCapture, onPick, canAnalyze, analyzing, onAnalyze }: {
  captures: Partial<Record<CaptureStep, string>>;
  onCapture: (s: CaptureStep) => void;
  onPick: (s: CaptureStep) => void;
  canAnalyze: boolean;
  analyzing: boolean;
  onAnalyze: () => void;
}) {
  return (
    <>
      <View style={styles.disclaimer}>
        <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
        <Text style={styles.disclaimerText}>
          AI extracts label info for convenience. Always verify details before use. This is not medical advice.
        </Text>
      </View>

      <Text style={styles.sectionLabel}>CAPTURE IMAGES</Text>
      {CAPTURE_STEPS.map((s) => {
        const captured = !!captures[s.key];
        const required = s.key === 'frontLabel' || s.key === 'factsPanel';
        return (
          <View key={s.key} style={[styles.captureCard, captured && styles.captureCardDone]}>
            <View style={[styles.captureIcon, captured && styles.captureIconDone]}>
              <Ionicons name={captured ? 'checkmark' : (s.icon as any)} size={20} color={captured ? colors.white : colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.captureLabel}>{s.label}</Text>
                {required && <View style={styles.requiredBadge}><Text style={styles.requiredText}>Required</Text></View>}
              </View>
              <Text style={styles.captureHint}>{captured ? 'Captured ✓' : s.hint}</Text>
            </View>
            <View style={{ gap: spacing.xs }}>
              <TouchableOpacity style={styles.captureBtn} onPress={() => onCapture(s.key)}>
                <Ionicons name="camera-outline" size={15} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.captureBtn} onPress={() => onPick(s.key)}>
                <Ionicons name="images-outline" size={15} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      <TouchableOpacity
        style={[styles.primaryBtn, (!canAnalyze || analyzing) && styles.btnDisabled]}
        onPress={onAnalyze}
        disabled={!canAnalyze || analyzing}
        activeOpacity={0.85}
      >
        {analyzing ? (
          <>
            <ActivityIndicator size="small" color={colors.white} />
            <Text style={styles.primaryBtnText}>Analysing label…</Text>
          </>
        ) : (
          <>
            <Ionicons name="scan-outline" size={18} color={colors.white} />
            <Text style={styles.primaryBtnText}>Analyse with AI</Text>
          </>
        )}
      </TouchableOpacity>

      {!canAnalyze && (
        <Text style={styles.hintText}>Capture at least the Front Label or Supplement Facts panel to continue.</Text>
      )}
    </>
  );
}

// ─── Step: Review ─────────────────────────────────────────────────────────────

function ReviewStep({
  scanned, editName, setEditName, editBrand, setEditBrand, editDose, setEditDose,
  editTimeOfDay, setEditTimeOfDay, editWithFood, setEditWithFood,
  editReminderTime, setEditReminderTime, editRefillDays, setEditRefillDays,
  onNext, showMedModal, setShowMedModal, medications, setMedications,
  medicationInput, setMedicationInput,
}: {
  scanned: ScannedSupplement;
  editName: string; setEditName: (v: string) => void;
  editBrand: string; setEditBrand: (v: string) => void;
  editDose: string; setEditDose: (v: string) => void;
  editTimeOfDay: TimeOfDay; setEditTimeOfDay: (v: TimeOfDay) => void;
  editWithFood: boolean; setEditWithFood: (v: boolean) => void;
  editReminderTime: string; setEditReminderTime: (v: string) => void;
  editRefillDays: string; setEditRefillDays: (v: string) => void;
  onNext: () => void;
  showMedModal: boolean; setShowMedModal: (v: boolean) => void;
  medications: string[]; setMedications: (v: string[]) => void;
  medicationInput: string; setMedicationInput: (v: string) => void;
}) {
  const addMed = () => {
    const m = medicationInput.trim();
    if (m && !medications.includes(m)) setMedications([...medications, m]);
    setMedicationInput('');
  };
  const removeMed = (m: string) => setMedications(medications.filter((x) => x !== m));

  return (
    <>
      <Text style={styles.stepTitle}>Review Scanned Details</Text>
      <Text style={styles.stepSubtitle}>Verify and correct any information before the safety check.</Text>

      <Text style={styles.sectionLabel}>BASIC INFO</Text>
      <View style={styles.card}>
        <FieldRow label="Supplement name" value={editName} onChange={setEditName} />
        <FieldRow label="Brand" value={editBrand} onChange={setEditBrand} />
        <FieldRow label="Serving size" value={editDose} onChange={setEditDose} />
        {scanned.expiryDate && <InfoRow label="Expiry" value={scanned.expiryDate} />}
        {scanned.estimatedServingsRemaining !== undefined && (
          <InfoRow label="Est. servings left" value={String(scanned.estimatedServingsRemaining)} />
        )}
      </View>

      {scanned.activeIngredients.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>ACTIVE INGREDIENTS</Text>
          <View style={styles.card}>
            {scanned.activeIngredients.map((ing, i) => (
              <View key={i} style={[styles.ingredientRow, i > 0 && styles.divider]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ingredientName}>{ing.name}</Text>
                  {ing.explanation && <Text style={styles.ingredientExplain}>{ing.explanation}</Text>}
                </View>
                <Text style={styles.ingredientAmount}>{ing.amountPerServing}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {(scanned.otherIngredients || scanned.allergens) && (
        <>
          <Text style={styles.sectionLabel}>OTHER INFO</Text>
          <View style={styles.card}>
            {scanned.otherIngredients ? <InfoRow label="Other ingredients" value={scanned.otherIngredients} /> : null}
            {scanned.allergens ? <InfoRow label="Allergens" value={scanned.allergens} /> : null}
          </View>
        </>
      )}

      {(scanned.directions || scanned.warnings) && (
        <>
          <Text style={styles.sectionLabel}>DIRECTIONS & WARNINGS</Text>
          <View style={styles.card}>
            {scanned.directions ? <InfoRow label="Directions" value={scanned.directions} /> : null}
            {scanned.warnings ? (
              <View style={[styles.warningBox, { marginTop: spacing.sm }]}>
                <Ionicons name="warning-outline" size={14} color="#E55A20" />
                <Text style={styles.warningText}>{scanned.warnings}</Text>
              </View>
            ) : null}
          </View>
        </>
      )}

      {/* Medication entry */}
      <TouchableOpacity style={styles.medBtn} onPress={() => setShowMedModal(true)}>
        <Ionicons name="medkit-outline" size={16} color={colors.primary} />
        <Text style={styles.medBtnText}>
          {medications.length > 0 ? `${medications.length} medication(s) added` : 'Add your medications (optional)'}
        </Text>
        <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.primaryBtn} onPress={onNext} activeOpacity={0.85}>
        <Ionicons name="shield-checkmark-outline" size={18} color={colors.white} />
        <Text style={styles.primaryBtnText}>Run Safety Check</Text>
      </TouchableOpacity>

      <Modal visible={showMedModal} transparent animationType="slide" onRequestClose={() => setShowMedModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your Medications</Text>
              <TouchableOpacity onPress={() => setShowMedModal(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalCaption}>
              Add any medicines you take regularly. The AI will flag potential interactions. Always confirm with a qualified healthcare professional.
            </Text>
            <View style={styles.medInputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={medicationInput}
                onChangeText={setMedicationInput}
                placeholder="e.g. Metformin 500mg"
                placeholderTextColor={colors.textMuted}
                onSubmitEditing={addMed}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.medAddBtn} onPress={addMed}>
                <Ionicons name="add" size={20} color={colors.white} />
              </TouchableOpacity>
            </View>
            {medications.map((m) => (
              <View key={m} style={styles.medChip}>
                <Text style={styles.medChipText}>{m}</Text>
                <TouchableOpacity onPress={() => removeMed(m)}>
                  <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={[styles.primaryBtn, { marginTop: spacing.lg }]} onPress={() => setShowMedModal(false)}>
              <Text style={styles.primaryBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ─── Step: Safety ─────────────────────────────────────────────────────────────

function SafetyStep({ flags, checking, onContinue }: { flags: SafetyFlag[]; checking: boolean; onContinue: () => void }) {
  if (checking) {
    return (
      <View style={styles.centerBlock}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Running safety check…</Text>
      </View>
    );
  }

  const hasDanger = flags.some((f) => f.severity === 'danger');

  return (
    <>
      <Text style={styles.stepTitle}>Safety Check</Text>
      <Text style={styles.stepSubtitle}>
        Potential interactions and cautions for your current stack.
      </Text>

      {flags.length === 0 ? (
        <View style={[styles.card, styles.safeCard]}>
          <Ionicons name="shield-checkmark" size={28} color={colors.success} />
          <Text style={styles.safeText}>No notable interactions found with your current stack.</Text>
        </View>
      ) : (
        flags.map((flag, i) => (
          <View key={i} style={[styles.flagCard, { borderLeftColor: SEVERITY_COLORS[flag.severity] }]}>
            <Ionicons
              name={flag.type === 'duplicate' ? 'copy-outline' : flag.type === 'allergen' ? 'alert-circle-outline' : 'warning-outline'}
              size={16}
              color={SEVERITY_COLORS[flag.severity]}
            />
            <Text style={styles.flagText}>{flag.message}</Text>
          </View>
        ))
      )}

      <View style={styles.disclaimerBox}>
        <Ionicons name="information-circle-outline" size={14} color={colors.textSecondary} />
        <Text style={styles.disclaimerSmall}>
          This is not a substitute for professional medical advice. Always consult a qualified healthcare professional before starting or changing supplements.
        </Text>
      </View>

      {hasDanger ? (
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: '#FF4D5E' }]}
          onPress={() =>
            Alert.alert(
              'Serious caution flagged',
              'The AI has identified a potentially serious issue. We strongly recommend consulting a healthcare professional before adding this supplement.',
              [
                { text: 'Go Back', style: 'cancel' },
                { text: 'Add Anyway', style: 'destructive', onPress: onContinue },
              ]
            )
          }
        >
          <Ionicons name="warning-outline" size={18} color={colors.white} />
          <Text style={styles.primaryBtnText}>Proceed with Caution</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.primaryBtn} onPress={onContinue} activeOpacity={0.85}>
          <Ionicons name="arrow-forward" size={18} color={colors.white} />
          <Text style={styles.primaryBtnText}>Continue to Schedule</Text>
        </TouchableOpacity>
      )}
    </>
  );
}

// ─── Step: Schedule ───────────────────────────────────────────────────────────

function ScheduleStep({
  scanned, editName, editTimeOfDay, setEditTimeOfDay, editWithFood, setEditWithFood,
  editReminderTime, setEditReminderTime, editRefillDays, setEditRefillDays,
  saving, onAdd,
}: {
  scanned: ScannedSupplement;
  editName: string;
  editTimeOfDay: TimeOfDay; setEditTimeOfDay: (v: TimeOfDay) => void;
  editWithFood: boolean; setEditWithFood: (v: boolean) => void;
  editReminderTime: string; setEditReminderTime: (v: string) => void;
  editRefillDays: string; setEditRefillDays: (v: string) => void;
  saving: boolean;
  onAdd: () => void;
}) {
  return (
    <>
      <Text style={styles.stepTitle}>Schedule & Reminders</Text>
      <Text style={styles.stepSubtitle}>Suggested from the label. Edit as needed.</Text>

      {scanned.scheduleRationale ? (
        <View style={styles.rationaleBox}>
          <Ionicons name="bulb-outline" size={15} color={colors.primary} />
          <Text style={styles.rationaleText}>{scanned.scheduleRationale}</Text>
        </View>
      ) : null}

      <Text style={styles.sectionLabel}>TIME OF DAY</Text>
      <View style={styles.pillRow}>
        {TIME_OF_DAY_META.map((t) => {
          const active = editTimeOfDay === t.id;
          return (
            <TouchableOpacity key={t.id} style={[styles.pill, active && styles.pillActive]} onPress={() => setEditTimeOfDay(t.id)}>
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={styles.checkRow} onPress={() => setEditWithFood(!editWithFood)} activeOpacity={0.8}>
        <Ionicons name={editWithFood ? 'checkbox' : 'square-outline'} size={20} color={editWithFood ? colors.primary : colors.textMuted} />
        <Text style={styles.checkLabel}>Take with food</Text>
      </TouchableOpacity>

      <Text style={styles.sectionLabel}>REMINDER TIME</Text>
      <TextInput
        style={styles.input}
        value={editReminderTime}
        onChangeText={setEditReminderTime}
        placeholder="08:00"
        placeholderTextColor={colors.textMuted}
      />

      <Text style={styles.sectionLabel}>SUPPLY (DAYS)</Text>
      <TextInput
        style={styles.input}
        value={editRefillDays}
        onChangeText={setEditRefillDays}
        keyboardType="number-pad"
        placeholder="30"
        placeholderTextColor={colors.textMuted}
      />
      <Text style={styles.hintText}>
        We'll notify you when you're running low based on your serving schedule.
      </Text>

      <TouchableOpacity
        style={[styles.primaryBtn, saving && styles.btnDisabled]}
        onPress={onAdd}
        disabled={saving}
        activeOpacity={0.85}
      >
        {saving ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <Ionicons name="add-circle-outline" size={18} color={colors.white} />
        )}
        <Text style={styles.primaryBtnText}>{saving ? 'Adding…' : `Add ${editName} to Stack`}</Text>
      </TouchableOpacity>
    </>
  );
}

// ─── History Tab ─────────────────────────────────────────────────────────────

function HistoryTab({ history, loading, onUse }: { history: ScanHistoryItem[]; loading: boolean; onUse: (item: ScanHistoryItem) => void }) {
  if (loading) {
    return (
      <View style={styles.centerBlock}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (history.length === 0) {
    return (
      <View style={styles.centerBlock}>
        <Ionicons name="scan-outline" size={40} color={colors.border} />
        <Text style={styles.emptyText}>No scan history yet.</Text>
      </View>
    );
  }
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {history.map((item) => (
        <View key={item.id} style={[styles.historyCard, shadow.soft]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.historyName}>{item.result.name}</Text>
            <Text style={styles.historyBrand}>{item.result.brand}</Text>
            <Text style={styles.historyDate}>{new Date(item.scannedAt).toLocaleDateString()}</Text>
          </View>
          <TouchableOpacity style={styles.useBtn} onPress={() => onUse(item)}>
            <Text style={styles.useBtnText}>Use</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function FieldRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput style={styles.fieldInput} value={value} onChangeText={onChange} placeholderTextColor={colors.textMuted} />
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={[styles.fieldRow, { alignItems: 'flex-start' }]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  title: { fontSize: 17, fontWeight: '800', color: colors.navy },
  subtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  tabRow: { flexDirection: 'row', marginHorizontal: spacing.lg, backgroundColor: colors.card, borderRadius: radii.xl, padding: 4, marginBottom: spacing.md },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radii.lg },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 13.5, fontWeight: '700', color: colors.textSecondary },
  tabTextActive: { color: colors.white },
  content: { padding: spacing.lg, paddingBottom: 40, gap: spacing.md },

  disclaimer: { flexDirection: 'row', gap: spacing.sm, backgroundColor: '#FFF5EE', borderRadius: radii.lg, padding: spacing.md, alignItems: 'flex-start', marginBottom: spacing.sm },
  disclaimerText: { flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  sectionLabel: { fontSize: 10.5, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5, marginBottom: spacing.sm },

  captureCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, borderWidth: 1.5, borderColor: colors.border },
  captureCardDone: { borderColor: colors.success },
  captureIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF5EE', alignItems: 'center', justifyContent: 'center' },
  captureIconDone: { backgroundColor: colors.success },
  captureLabel: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  captureHint: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  captureBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  requiredBadge: { backgroundColor: '#FFE7CF', borderRadius: radii.sm, paddingHorizontal: 6, paddingVertical: 2 },
  requiredText: { fontSize: 9.5, fontWeight: '700', color: colors.primary },

  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, marginTop: spacing.sm },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  btnDisabled: { opacity: 0.5 },
  hintText: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },

  stepTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  stepSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.md },

  card: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, gap: spacing.sm },
  ingredientRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: spacing.sm, gap: spacing.sm },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  ingredientName: { fontSize: 13.5, fontWeight: '700', color: colors.textPrimary },
  ingredientExplain: { fontSize: 11.5, color: colors.textSecondary, marginTop: 2, lineHeight: 16 },
  ingredientAmount: { fontSize: 13, fontWeight: '600', color: colors.primary },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  fieldLabel: { fontSize: 12, color: colors.textMuted, width: 110 },
  fieldInput: { flex: 1, fontSize: 13.5, fontWeight: '600', color: colors.textPrimary, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 4 },
  fieldValue: { flex: 1, fontSize: 13, color: colors.textPrimary, lineHeight: 18 },
  warningBox: { flexDirection: 'row', gap: spacing.sm, backgroundColor: '#FFF0E8', borderRadius: radii.md, padding: spacing.md, alignItems: 'flex-start' },
  warningText: { flex: 1, fontSize: 12, color: '#E55A20', lineHeight: 17 },

  medBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, borderWidth: 1.5, borderColor: colors.border },
  medBtnText: { flex: 1, fontSize: 13.5, fontWeight: '600', color: colors.textPrimary },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(20,20,43,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.card, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: spacing.lg },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  modalCaption: { fontSize: 12.5, color: colors.textSecondary, lineHeight: 18, marginBottom: spacing.md },
  medInputRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  input: { backgroundColor: colors.background, borderRadius: radii.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, fontSize: 14, color: colors.textPrimary },
  medAddBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  medChip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.background, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginBottom: spacing.xs },
  medChipText: { fontSize: 13, color: colors.textPrimary, fontWeight: '600' },

  centerBlock: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  loadingText: { fontSize: 14, color: colors.textSecondary },
  emptyText: { fontSize: 14, color: colors.textMuted },

  safeCard: { alignItems: 'center', gap: spacing.md },
  safeText: { fontSize: 14, color: colors.textPrimary, textAlign: 'center', fontWeight: '600' },
  flagCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md, borderLeftWidth: 3 },
  flagText: { flex: 1, fontSize: 13, color: colors.textPrimary, lineHeight: 18 },
  disclaimerBox: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.background, borderRadius: radii.lg, padding: spacing.md, alignItems: 'flex-start' },
  disclaimerSmall: { flex: 1, fontSize: 11.5, color: colors.textSecondary, lineHeight: 16 },

  rationaleBox: { flexDirection: 'row', gap: spacing.sm, backgroundColor: '#FFF5EE', borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.sm, alignItems: 'flex-start' },
  rationaleText: { flex: 1, fontSize: 12.5, color: colors.textSecondary, lineHeight: 18 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  pill: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.pill, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, backgroundColor: colors.card },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  pillTextActive: { color: colors.white },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  checkLabel: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },

  historyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg },
  historyName: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  historyBrand: { fontSize: 12.5, color: colors.textSecondary, marginTop: 2 },
  historyDate: { fontSize: 11.5, color: colors.textMuted, marginTop: 2 },
  useBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  useBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
});
