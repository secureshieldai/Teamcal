import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, type BarcodeScanningResult, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radii, spacing } from '../theme';
import { mealsService, type ScanResult } from '../services/api/meals.service';
import { coachService } from '../services/api/coach.service';
import { personalService } from '../services/api/personal.service';
import type { RootStackParamList } from '../navigation/types';

type Mode = 'food' | 'barcode' | 'cook';

const MODE_COPY: Record<Mode, { title: string; subtitle: string; hint: string; badge: boolean }> = {
  food: { title: 'Food Scanner', subtitle: 'Point at your food to scan and\nget instant nutrition info', hint: 'Align food within the frame', badge: true },
  barcode: { title: 'Barcode Scanner', subtitle: 'Scan the barcode on packaged\nfoods and labels', hint: 'Align barcode within the frame', badge: false },
  cook: { title: 'Scan & Cook', subtitle: 'Scan your ingredients to get\ninstant recipe ideas', hint: 'Align ingredients within the frame', badge: true },
};

const MODE_OPTIONS: { key: Mode; label: string; description: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'food', label: 'Scan Food', description: 'Identify meals and\nget nutrition info', icon: 'nutrition-outline' },
  { key: 'barcode', label: 'Scan Barcode', description: 'Scan packaged\nfoods & labels', icon: 'barcode-outline' },
  { key: 'cook', label: 'Scan & Cook', description: 'Scan ingredients to\nget recipe ideas', icon: 'restaurant-outline' },
];

export default function ScanFoodScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ScanFood'>>();
  const camera = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<Mode>(route.params?.mode || 'food');
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [flash, setFlash] = useState(false);
  const [busy, setBusy] = useState(false);
  const [barcodeLocked, setBarcodeLocked] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [recipe, setRecipe] = useState('');

  const analyze = async (asset: { uri: string; mimeType?: string | null; fileName?: string | null }) => {
    setPhoto(asset.uri); setBusy(true); setResult(null);
    try { const scanned=await mealsService.scanImage(asset);setResult(scanned);if(mode==='cook'){const generated=await coachService.sendMessage(`Create one concise healthy recipe using: ${scanned.items.map(i=>i.name).join(', ')}. Include ingredients and numbered cooking steps.`);setRecipe(generated.reply);} }
    catch (error) { Alert.alert('AI Vision failed', (error as Error).message); setPhoto(null); }
    finally { setBusy(false); }
  };
  const capture = async () => {
    const shot = await camera.current?.takePictureAsync({ quality: .75 }); if (shot) analyze({ uri: shot.uri, fileName: 'meal.jpg', mimeType: 'image/jpeg' });
  };
  const gallery = async () => {
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: .8 }); if (!picked.canceled) analyze(picked.assets[0]);
  };
  const scanned = async ({ data }: BarcodeScanningResult) => {
    if (barcodeLocked || busy) return; setBarcodeLocked(true); setBusy(true);
    try { const found = await mealsService.lookupBarcode(data); setResult(found); setPhoto(found.image || null); }
    catch (error) { Alert.alert('Barcode lookup', (error as Error).message, [{ text: 'Try again', onPress: () => setBarcodeLocked(false) }]); }
    finally { setBusy(false); }
  };
  const reset = () => { setResult(null); setRecipe(''); setPhoto(null); setBarcodeLocked(false); };
  const changeMode = (next: Mode) => { setMode(next); reset(); };
  const log = async () => {
    if (!result) return; setBusy(true);
    if(mode==='cook'){try{await personalService.create('recipe',{title:`Recipe with ${result.items.map(i=>i.name).join(', ')}`,details:recipe,date:new Date().toISOString()});Alert.alert('Recipe saved','Find it under My Recipes.',[{text:'Done',onPress:()=>navigation.goBack()}]);}catch(error){Alert.alert('Could not save recipe',(error as Error).message);}finally{setBusy(false);}return;}
    try { await mealsService.logScanResult(result.items, { kcal: result.totals.kcal, protein: result.totals.p, carbs: result.totals.c, fats: result.totals.f }); Alert.alert('Meal logged', 'Nutrition was added to today’s progress.', [{ text: 'Done', onPress: () => navigation.goBack() }]); }
    catch (error) { Alert.alert('Could not log meal', (error as Error).message); }
    finally { setBusy(false); }
  };
  const showHelp = () => Alert.alert('How it works', 'Point your camera at your food and tap the shutter button. TeamCal’s AI will identify what you’re eating and estimate its nutrition instantly.');

  const copy = MODE_COPY[mode];

  if (!permission) return <View style={styles.center}><ActivityIndicator color={colors.primary}/></View>;
  if (!permission.granted) return <SafeAreaView style={styles.permission}><Ionicons name="camera-outline" size={54} color={colors.primary}/><Text style={styles.permissionTitle}>Camera access required</Text><Text style={styles.permissionText}>TeamCal uses the camera only when you scan a meal or barcode.</Text><TouchableOpacity style={styles.primary} onPress={requestPermission}><Text style={styles.primaryText}>Allow Camera</Text></TouchableOpacity><TouchableOpacity onPress={gallery}><Text style={styles.galleryText}>Choose a food photo instead</Text></TouchableOpacity></SafeAreaView>;

  return <View style={styles.container}><StatusBar barStyle="light-content"/>
    {!photo && <CameraView ref={camera} style={StyleSheet.absoluteFill} facing={facing} enableTorch={flash} barcodeScannerSettings={{ barcodeTypes: ['ean13','ean8','upc_a','upc_e','code128'] }} onBarcodeScanned={mode === 'barcode' && !barcodeLocked ? scanned : undefined}/>}
    {photo && <Image source={{uri:photo}} style={StyleSheet.absoluteFill} resizeMode="cover"/>}<View style={styles.overlay}/>
    <SafeAreaView style={styles.safe} edges={['top','bottom']}>
      <View style={styles.top}>
        <TouchableOpacity style={styles.iconBtn} onPress={()=>navigation.goBack()}>
          <Ionicons name="close" size={22} color="white"/>
          <Text style={styles.iconLabel}>Close</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={()=>setFlash(v=>!v)}>
          <Ionicons name={flash?'flash':'flash-outline'} size={22} color="white"/>
          <Text style={styles.iconLabel}>Flash</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={showHelp}>
          <Ionicons name="help-circle-outline" size={22} color="white"/>
          <Text style={styles.iconLabel}>Help</Text>
        </TouchableOpacity>
      </View>

      {!result && (
        <View style={styles.titleBlock}>
          <View style={styles.titleRow}>
            {copy.badge && <Ionicons name="sparkles" size={18} color={colors.primary} style={{ marginRight: 6 }} />}
            <Text style={styles.title}>{copy.badge ? 'AI ' : ''}{copy.title}</Text>
          </View>
          <Text style={styles.subtitle}>{copy.subtitle}</Text>
        </View>
      )}

      {!result && (
        <View style={styles.scanArea}>
          <View style={styles.frame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <View style={styles.hintPill}>
            <Ionicons name="scan-outline" size={14} color={colors.primary} />
            <Text style={styles.hintText}>{copy.hint}</Text>
          </View>
          {busy && <View style={styles.busy}><ActivityIndicator color="white"/><Text style={styles.busyText}>{mode==='barcode'?'Looking up product…':'AI is analyzing nutrition…'}</Text></View>}
        </View>
      )}

      {result ? (
        <ScrollView style={styles.result} contentContainerStyle={styles.resultContent}>
          <View style={styles.resultHeader}>
            <View style={{flex:1}}>
              <Text style={styles.resultTitle}>{result.items.map(i=>i.name).join(', ')}</Text>
              {result.barcode && <Text style={styles.code}>Barcode {result.barcode}{result.source ? ` · ${result.source === 'usda-fdc' ? 'USDA FoodData Central' : 'Open Food Facts'}` : ''}</Text>}
            </View>
            <Text style={styles.kcal}>{Math.round(result.totals.kcal)} kcal</Text>
          </View>
          <View style={styles.macros}>
            <Macro label="Protein" value={result.totals.p}/>
            <Macro label="Carbs" value={result.totals.c}/>
            <Macro label="Fat" value={result.totals.f}/>
          </View>
          {result.items.map((item,index)=>
            <View key={`${item.name}-${index}`} style={styles.item}>
              <View style={{flex:1}}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemMeta}>{item.servingText || `${item.grams}${item.servingUnit || 'g'}`} · {Math.round(item.confidence*100)}% confidence</Text>
              </View>
              <Text style={styles.itemKcal}>{Math.round(item.kcal)} kcal</Text>
            </View>
          )}
          {mode==='cook'&&<Text style={styles.itemMeta}>{recipe||'Generating recipe…'}</Text>}
          <TouchableOpacity style={styles.primary} disabled={busy||(mode==='cook'&&!recipe)} onPress={log}><Text style={styles.primaryText}>{busy?'Saving…':mode==='cook'?'Save Recipe':'Log Food'}</Text></TouchableOpacity>
          <TouchableOpacity onPress={reset}><Text style={styles.rescan}>Scan Again</Text></TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={styles.bottomSheet}>
          <View style={styles.modeRow}>
            {MODE_OPTIONS.map((option) => {
              const active = option.key === mode;
              return (
                <TouchableOpacity key={option.key} style={[styles.modeCard, active && styles.modeCardActive]} onPress={() => changeMode(option.key)} activeOpacity={0.85}>
                  <Ionicons name={option.icon} size={22} color={active ? colors.primary : 'rgba(255,255,255,0.85)'} />
                  <Text style={[styles.modeLabel, active && styles.modeLabelActive]}>{option.label}</Text>
                  <Text style={styles.modeDescription}>{option.description}</Text>
                  {active && <View style={styles.modeUnderline} />}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.controls}>
            <TouchableOpacity style={styles.smallControl} onPress={gallery}>
              <View style={styles.smallControlCircle}><Ionicons name="images-outline" size={22} color="white"/></View>
              <Text style={styles.controlText}>Photos</Text>
            </TouchableOpacity>

            {mode === 'barcode'
              ? <View style={styles.barcodeWaiting}><Ionicons name="barcode-outline" size={30} color="white"/></View>
              : <TouchableOpacity style={styles.shutter} disabled={busy} onPress={capture}><View style={styles.shutterInner}/></TouchableOpacity>}

            <TouchableOpacity style={styles.smallControl} onPress={()=>setFacing(v=>v==='back'?'front':'back')}>
              <View style={styles.smallControlCircle}><Ionicons name="camera-reverse-outline" size={24} color="white"/></View>
              <Text style={styles.controlText}>Flip Camera</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  </View>;
}

function Macro({label,value}:{label:string;value:number}) { return <View style={styles.macro}><Text style={styles.macroValue}>{Math.round(value)}g</Text><Text style={styles.macroLabel}>{label}</Text></View>; }

const FRAME_SIZE = 280;
const CORNER_SIZE = 30;

const styles=StyleSheet.create({
  container:{flex:1,backgroundColor:colors.navy},
  center:{flex:1,alignItems:'center',justifyContent:'center'},
  overlay:{...StyleSheet.absoluteFill,backgroundColor:'rgba(5,10,25,.32)'},
  safe:{flex:1,justifyContent:'space-between'},
  top:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:spacing.xl,paddingTop:spacing.sm},
  iconBtn:{alignItems:'center',gap:6},
  iconLabel:{color:'white',fontSize:11,fontWeight:'600'},
  titleBlock:{alignItems:'center',paddingHorizontal:spacing.xxl,marginTop:spacing.lg},
  titleRow:{flexDirection:'row',alignItems:'center'},
  title:{color:'white',fontSize:22,fontWeight:'800'},
  subtitle:{color:'rgba(255,255,255,0.78)',fontSize:13,textAlign:'center',marginTop:6,lineHeight:19},
  scanArea:{flex:1,alignItems:'center',justifyContent:'center'},
  frame:{width:FRAME_SIZE,height:FRAME_SIZE * 0.82,position:'relative'},
  corner:{position:'absolute',width:CORNER_SIZE,height:CORNER_SIZE,borderColor:'white'},
  cornerTL:{top:0,left:0,borderTopWidth:3,borderLeftWidth:3,borderTopLeftRadius:radii.md},
  cornerTR:{top:0,right:0,borderTopWidth:3,borderRightWidth:3,borderTopRightRadius:radii.md},
  cornerBL:{bottom:0,left:0,borderBottomWidth:3,borderLeftWidth:3,borderBottomLeftRadius:radii.md},
  cornerBR:{bottom:0,right:0,borderBottomWidth:3,borderRightWidth:3,borderBottomRightRadius:radii.md},
  hintPill:{flexDirection:'row',alignItems:'center',gap:6,backgroundColor:'rgba(0,0,0,.5)',borderRadius:radii.pill,paddingHorizontal:spacing.md,paddingVertical:spacing.sm,marginTop:spacing.xl},
  hintText:{color:'white',fontSize:12.5,fontWeight:'600'},
  busy:{position:'absolute',backgroundColor:'rgba(0,0,0,.7)',borderRadius:radii.lg,padding:spacing.lg,alignItems:'center'},
  busyText:{color:'white',marginTop:spacing.sm,fontWeight:'600'},
  bottomSheet:{backgroundColor:'rgba(10,14,28,0.78)',borderTopLeftRadius:radii.xl,borderTopRightRadius:radii.xl,paddingTop:spacing.lg,paddingHorizontal:spacing.lg},
  modeRow:{flexDirection:'row',gap:spacing.sm},
  modeCard:{flex:1,alignItems:'center',borderWidth:1.5,borderColor:'rgba(255,255,255,0.14)',borderRadius:radii.lg,paddingVertical:spacing.md,paddingHorizontal:spacing.xs,gap:6},
  modeCardActive:{borderColor:colors.primary,backgroundColor:'rgba(255,106,43,0.14)'},
  modeLabel:{color:'rgba(255,255,255,0.85)',fontSize:12.5,fontWeight:'800',textAlign:'center'},
  modeLabelActive:{color:colors.primary},
  modeDescription:{color:'rgba(255,255,255,0.55)',fontSize:10,textAlign:'center',lineHeight:13},
  modeUnderline:{width:22,height:2.5,borderRadius:2,backgroundColor:colors.primary,marginTop:2},
  controls:{flexDirection:'row',alignItems:'center',justifyContent:'space-around',paddingVertical:spacing.xl},
  smallControl:{width:70,alignItems:'center',gap:6},
  smallControlCircle:{width:48,height:48,borderRadius:24,backgroundColor:'rgba(255,255,255,0.12)',alignItems:'center',justifyContent:'center'},
  controlText:{color:'white',fontSize:11,fontWeight:'600',textAlign:'center'},
  shutter:{width:76,height:76,borderRadius:38,borderWidth:5,borderColor:'white',alignItems:'center',justifyContent:'center'},
  shutterInner:{width:58,height:58,borderRadius:29,backgroundColor:colors.primary},
  barcodeWaiting:{width:76,height:76,borderRadius:38,backgroundColor:'rgba(0,0,0,.5)',alignItems:'center',justifyContent:'center'},
  result:{maxHeight:'62%',backgroundColor:colors.card,borderTopLeftRadius:radii.xl,borderTopRightRadius:radii.xl},
  resultContent:{padding:spacing.xl},
  resultHeader:{flexDirection:'row',gap:spacing.md},
  resultTitle:{fontSize:18,fontWeight:'800',color:colors.textPrimary},
  code:{fontSize:11,color:colors.textSecondary,marginTop:4},
  kcal:{color:colors.primary,fontWeight:'800',fontSize:17},
  macros:{flexDirection:'row',gap:spacing.sm,marginVertical:spacing.lg},
  macro:{flex:1,backgroundColor:colors.background,borderRadius:radii.md,padding:spacing.md,alignItems:'center'},
  macroValue:{fontWeight:'800',color:colors.textPrimary},
  macroLabel:{fontSize:11,color:colors.textSecondary,marginTop:2},
  item:{flexDirection:'row',paddingVertical:spacing.md,borderTopWidth:1,borderTopColor:colors.border},
  itemName:{fontWeight:'700',color:colors.textPrimary},
  itemMeta:{fontSize:11,color:colors.textSecondary,marginTop:3},
  itemKcal:{fontWeight:'700',color:colors.textPrimary},
  primary:{backgroundColor:colors.primary,borderRadius:radii.pill,paddingVertical:spacing.md,alignItems:'center',marginTop:spacing.lg,paddingHorizontal:spacing.xl},
  primaryText:{color:'white',fontWeight:'800'},
  rescan:{color:colors.textSecondary,textAlign:'center',fontWeight:'700',marginTop:spacing.md},
  permission:{flex:1,backgroundColor:colors.background,alignItems:'center',justifyContent:'center',padding:32},
  permissionTitle:{fontSize:21,fontWeight:'800',color:colors.textPrimary,marginTop:spacing.lg},
  permissionText:{color:colors.textSecondary,textAlign:'center',marginTop:spacing.sm},
  galleryText:{color:colors.primary,fontWeight:'700',marginTop:spacing.lg},
});
