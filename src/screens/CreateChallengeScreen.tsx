import React, { useState } from 'react';
import { Alert, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import WizardStepIndicator from '../components/WizardStepIndicator';
import CreateBasicsStep from './challenges/CreateBasicsStep';
import ChallengeDetailsStep from './challenges/ChallengeDetailsStep';
import ChallengeSettingsStep from './challenges/ChallengeSettingsStep';
import ChallengeCreatedStep from './challenges/ChallengeCreatedStep';
import { colors, spacing, typography } from '../theme';
import { challengesService } from '../services/api/challenges.service';
import { challengeTypes } from '../data/challengesData';
import type { Challenge } from '../types/api';
import type { RootStackParamList } from '../navigation/types';

const STEP_TITLES = ['Create Challenge', 'Challenge Details', 'Challenge Settings'];

export default function CreateChallengeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [step, setStep] = useState(1);
  const [created, setCreated] = useState<Challenge | null>(null);
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState('');
  const [challengeType, setChallengeType] = useState(challengeTypes[0].id);
  const [durationDays, setDurationDays] = useState(7);
  const [goalTarget, setGoalTarget] = useState('10000');
  const [isPublic, setIsPublic] = useState(true);
  const [allowInvites, setAllowInvites] = useState(true);
  const [maxParticipants, setMaxParticipants] = useState('');
  const [rules, setRules] = useState('');

  const handleCreate = async () => {
    setCreating(true);
    try {
      const type = challengeTypes.find((t) => t.id === challengeType) ?? challengeTypes[0];
      const challenge = await challengesService.create({
        title: name.trim(),
        description: description.trim(),
        durationDays,
        totalDays: durationDays,
        photo: photo || undefined,
        isPublic,
        icon: type.icon,
        iconColor: type.color,
        challengeType: type.id,
        goalTarget: Number(goalTarget) || undefined,
        goalUnit: type.unit,
        maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
        endsAt: Date.now() + durationDays * 86_400_000,
        rules: rules.trim() || undefined,
      });
      setCreated(challenge);
    } catch (error) {
      Alert.alert('Could not create challenge', (error as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const closeWizard = () => navigation.goBack();

  if (created) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" />
        <View style={styles.successHeader}>
          <TouchableOpacity style={styles.successIconBtn} onPress={closeWizard} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="chevron-back" size={20} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.successIconBtn} onPress={closeWizard} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
        <ChallengeCreatedStep
          challenge={created}
          onInviteFriends={() => navigation.replace('ChallengeInvite', { challengeId: created.id })}
          onViewChallenge={() => navigation.replace('ChallengeDetail', { challengeId: created.id })}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeLight} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (step === 1 ? closeWizard() : setStep((s) => s - 1))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name={step === 1 ? 'close' : 'chevron-back'} size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{STEP_TITLES[step - 1]}</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.stepIndicatorWrap}>
        <WizardStepIndicator currentStep={step} totalSteps={3} />
      </View>

      {step === 1 && (
        <CreateBasicsStep
          name={name}
          setName={setName}
          description={description}
          setDescription={setDescription}
          photo={photo}
          setPhoto={setPhoto}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <ChallengeDetailsStep
          challengeType={challengeType}
          setChallengeType={setChallengeType}
          durationDays={durationDays}
          setDurationDays={setDurationDays}
          goalTarget={goalTarget}
          setGoalTarget={setGoalTarget}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <ChallengeSettingsStep
          isPublic={isPublic}
          setIsPublic={setIsPublic}
          allowInvites={allowInvites}
          setAllowInvites={setAllowInvites}
          maxParticipants={maxParticipants}
          setMaxParticipants={setMaxParticipants}
          durationDays={durationDays}
          rules={rules}
          setRules={setRules}
          onCreate={handleCreate}
          onBack={() => setStep(2)}
          creating={creating}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeLight: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1, backgroundColor: colors.navy },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  headerTitle: { ...typography.h2, color: colors.textPrimary },
  stepIndicatorWrap: { paddingHorizontal: spacing.lg },
  successHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  successIconBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
});
