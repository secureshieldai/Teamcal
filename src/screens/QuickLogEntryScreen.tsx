import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { trackerService } from '../services/api/tracker.service';
import { mealsService } from '../services/api/meals.service';
import { fastingService } from '../services/api/fasting.service';
import { colors, radii, spacing, typography } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'QuickLogEntry'>;
const config: Record<string, { title: string; unit: string; tracker: string; preset?: string }> = {
  water: { title: 'Log Water', unit: 'ml', tracker: 'water', preset: '250' },
  workout: { title: 'Log Workout', unit: 'minutes', tracker: 'workouts', preset: '30' },
  weight: { title: 'Log Weight', unit: 'kg', tracker: 'weight' },
  steps: { title: 'Log Steps', unit: 'steps', tracker: 'steps' },
  sleep: { title: 'Log Sleep', unit: 'hours', tracker: 'sleep' },
  'body-stats': { title: 'Body Measurement', unit: 'cm', tracker: 'body-measurements' },
  supplement: { title: 'Log Supplement', unit: 'dose', tracker: 'supplements', preset: '1' },
  mood: { title: 'Mood & Energy', unit: '1–10', tracker: 'mood', preset: '5' },
  note: { title: 'Add Note', unit: '', tracker: 'notes', preset: '1' },
};

export default function QuickLogEntryScreen({ route, navigation }: Props) {
  const kind = route.params.kind;
  const isMeal = kind === 'meal'; const isFasting = kind === 'fasting';
  const item = config[kind] ?? { title: 'Quick Log', unit: '', tracker: kind };
  const [value, setValue] = useState(item.preset ?? ''); const [name, setName] = useState('');
  const [protein, setProtein] = useState(''); const [carbs, setCarbs] = useState(''); const [fat, setFat] = useState('');
  const [note, setNote] = useState(''); const [busy, setBusy] = useState(false); const [activeFast, setActiveFast] = useState(false);
  useEffect(() => { if (isFasting) fastingService.getActive().then(f => setActiveFast(Boolean(f))).catch(() => {}); }, [isFasting]);
  const submit = async () => { try { setBusy(true); if (isFasting) { if (activeFast) await fastingService.stop(); else await fastingService.start('16:8', 16); }
    else if (isMeal) { const kcal = Number(value); if (!name.trim() || !(kcal > 0)) throw new Error('Enter a meal name and calories.'); await mealsService.log({ name: name.trim(), kcal, protein: Number(protein)||0, carbs: Number(carbs)||0, fats: Number(fat)||0 }); }
    else { const amount = Number(value); if (!Number.isFinite(amount) || amount <= 0) throw new Error('Enter a valid value.'); await trackerService.log(item.tracker as never, amount, { note: note.trim() }); }
    Alert.alert('Logged', `${isFasting ? 'Fasting status' : item.title} updated.`, [{ text: 'Done', onPress: () => navigation.goBack() }]);
  } catch (e) { Alert.alert('Unable to log', (e as Error).message); } finally { setBusy(false); } };
  return <SafeAreaView style={s.safe}><View style={s.header}><TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={24} color={colors.textPrimary}/></TouchableOpacity><Text style={s.title}>{isMeal ? 'Log Meal Manually' : isFasting ? 'Fasting' : item.title}</Text><View style={{width:24}}/></View>
    <ScrollView contentContainerStyle={s.content}>{isMeal && <><Text style={s.label}>Meal name</Text><TextInput style={s.input} value={name} onChangeText={setName} placeholder="e.g. Chicken salad"/></>}
    {!isFasting && <><Text style={s.label}>{isMeal ? 'Calories' : `${item.title} ${item.unit ? `(${item.unit})` : ''}`}</Text><TextInput style={s.input} value={value} onChangeText={setValue} keyboardType="decimal-pad" placeholder={item.unit}/></>}
    {isMeal && <View style={s.columns}>{[['Protein (g)',protein,setProtein],['Carbs (g)',carbs,setCarbs],['Fat (g)',fat,setFat]].map(([l,v,f])=><View style={s.column} key={l as string}><Text style={s.label}>{l as string}</Text><TextInput style={s.input} value={v as string} onChangeText={f as (x:string)=>void} keyboardType="decimal-pad"/></View>)}</View>}
    {!isMeal && !isFasting && <><Text style={s.label}>Note (optional)</Text><TextInput style={[s.input,s.notes]} value={note} onChangeText={setNote} multiline/></>}
    {isFasting && <Text style={s.info}>{activeFast ? 'A fast is currently active. Stop it when you are ready to eat.' : 'Start a 16:8 fast. The Home dashboard timer will update automatically.'}</Text>}
    <TouchableOpacity style={[s.button,busy&&{opacity:.5}]} onPress={submit} disabled={busy}><Text style={s.buttonText}>{busy?'Saving…':isFasting?(activeFast?'Stop Fast':'Start Fast'):'Save Entry'}</Text></TouchableOpacity></ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:colors.background},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:spacing.lg},title:{...typography.h2,color:colors.textPrimary},content:{padding:spacing.lg},label:{...typography.caption,color:colors.textSecondary,marginTop:spacing.md,marginBottom:spacing.sm},input:{backgroundColor:colors.card,borderWidth:1,borderColor:colors.border,borderRadius:radii.md,padding:spacing.md,color:colors.textPrimary},notes:{minHeight:90,textAlignVertical:'top'},columns:{flexDirection:'row',gap:spacing.sm},column:{flex:1},info:{backgroundColor:colors.card,padding:spacing.lg,borderRadius:radii.lg,color:colors.textSecondary,lineHeight:21},button:{backgroundColor:colors.primary,borderRadius:radii.pill,padding:spacing.md,alignItems:'center',marginTop:spacing.xl},buttonText:{color:colors.white,fontWeight:'700'}});
