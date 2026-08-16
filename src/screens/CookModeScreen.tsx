import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radii, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

const RING_SIZE = 180;
const RING_STROKE = 10;

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function CookModeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'CookMode'>>();
  const { recipe } = route.params;

  const [stepIndex, setStepIndex] = useState(0);
  const [remaining, setRemaining] = useState(recipe.steps[0]?.seconds ?? 60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const step = recipe.steps[stepIndex];
  const total = recipe.steps.length;
  const isLast = stepIndex === total - 1;

  useEffect(() => {
    setRemaining(step?.seconds ?? 60);
    setRunning(false);
  }, [stepIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining((r) => (r > 0 ? r - 1 : 0));
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const duration = step?.seconds ?? 60;
  const radius = (RING_SIZE - RING_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentDone = duration > 0 ? 1 - remaining / duration : 0;
  const strokeDashoffset = circumference * (1 - percentDone);

  const goBackStep = () => setStepIndex((i) => Math.max(0, i - 1));
  const goNextStep = () => {
    if (isLast) {
      setFinished(true);
      return;
    }
    setStepIndex((i) => Math.min(total - 1, i + 1));
  };

  if (finished) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.completeHeader}>
          <Text style={styles.completeTitle}>{recipe.title.toUpperCase()}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.completeBody}>
          <View style={styles.completeCircle}>
            <Ionicons name="checkmark" size={40} color={colors.white} />
          </View>
          <Text style={styles.completeHeading}>You made it!</Text>
          <Text style={styles.completeCaption}>Enjoy your {recipe.title}. Snap a photo and share it in the community.</Text>
          <TouchableOpacity style={styles.completeDoneBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Text style={styles.completeDoneText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {recipe.title.toUpperCase()}
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(stepIndex / total) * 100}%` }]} />
      </View>

      <View style={styles.body}>
        <Text style={styles.stepCounter}>
          STEP {stepIndex + 1} OF {total}
        </Text>
        <Text style={styles.stepText}>{step?.text}</Text>

        <View style={styles.timerWrap}>
          <View style={{ width: RING_SIZE, height: RING_SIZE }}>
            <Svg width={RING_SIZE} height={RING_SIZE} style={{ transform: [{ rotateZ: '-90deg' }] }}>
              <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={radius} stroke={colors.border} strokeWidth={RING_STROKE} fill="none" />
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={radius}
                stroke={colors.primary}
                strokeWidth={RING_STROKE}
                strokeLinecap="round"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                fill="none"
              />
            </Svg>
            <View style={styles.timerCenter}>
              <Text style={styles.timerText}>{formatTime(remaining)}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.playBtn} onPress={() => setRunning((r) => !r)} activeOpacity={0.85}>
            <Ionicons name={running ? 'pause' : 'play'} size={22} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.timerHint}>{running ? 'Timer running…' : remaining === 0 ? 'Time’s up!' : 'Tap to start the timer'}</Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        {stepIndex > 0 && (
          <TouchableOpacity style={styles.backBtn} onPress={goBackStep}>
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.nextBtn} onPress={goNextStep} activeOpacity={0.85}>
          <Ionicons name="checkmark" size={16} color={colors.white} />
          <Text style={styles.nextBtnText}>{isLast ? 'Finish' : 'Done — next step'}</Text>
          <Ionicons name="play-skip-forward" size={14} color={colors.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.md },
  headerTitle: { flex: 1, fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5 },
  progressTrack: { height: 3, backgroundColor: colors.border, marginTop: spacing.sm },
  progressFill: { height: 3, backgroundColor: colors.primary },
  body: { flex: 1, padding: spacing.lg, alignItems: 'center' },
  stepCounter: { alignSelf: 'flex-start', fontSize: 11, fontWeight: '700', color: colors.primary, letterSpacing: 0.5, marginTop: spacing.lg },
  stepText: { alignSelf: 'flex-start', fontSize: 19, fontWeight: '700', color: colors.textPrimary, lineHeight: 27, marginTop: spacing.sm, marginBottom: spacing.xxl },
  timerWrap: { alignItems: 'center', marginTop: spacing.xl, gap: spacing.md },
  timerCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  timerText: { fontSize: 32, fontWeight: '800', color: colors.textPrimary },
  playBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  timerHint: { fontSize: 12.5, color: colors.textSecondary },
  footerRow: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg },
  backBtn: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.pill, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  nextBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md },
  nextBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  completeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  completeTitle: { flex: 1, fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5 },
  completeBody: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing.md },
  completeCircle: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  completeHeading: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  completeCaption: { fontSize: 13.5, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  completeDoneBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, paddingHorizontal: spacing.xxl, marginTop: spacing.lg },
  completeDoneText: { color: colors.white, fontWeight: '700', fontSize: 15 },
});
