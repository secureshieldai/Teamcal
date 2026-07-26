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
import type { RootStackParamList } from '../navigation/types';

type Mode = 'food' | 'barcode';

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

  const analyze = async (asset: { uri: string; mimeType?: string | null; fileName?: string | null }) => {
    setPhoto(asset.uri); setBusy(true); setResult(null);
    try { setResult(await mealsService.scanImage(asset)); }
    catch (error) { Alert.alert('AI Vision failed', (error as Error).message); setPhoto(null); }
    finally { setBusy(false); }
  };
  const capture = async () => { const shot = await camera.current?.takePictureAsync({ quality: .75 }); if (shot) analyze({ uri: shot.uri, fileName: 'meal.jpg', mimeType: 'image/jpeg' }); };
  const gallery = async () => { const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: .8 }); if (!picked.canceled) analyze(picked.assets[0]); };
  const scanned = async ({ data }: BarcodeScanningResult) => {
    if (barcodeLocked || busy) return; setBarcodeLocked(true); setBusy(true);
    try { const found = await mealsService.lookupBarcode(data); setResult(found); setPhoto(found.image || null); }
    catch (error) { Alert.alert('Barcode lookup', (error as Error).message, [{ text: 'Try again', onPress: () => setBarcodeLocked(false) }]); }
    finally { setBusy(false); }
  };
  const reset = () => { setResult(null); setPhoto(null); setBarcodeLocked(false); };
  const log = async () => {
    if (!result) return; setBusy(true);
    try { await mealsService.logScanResult(result.items, { kcal: result.totals.kcal, protein: result.totals.p, carbs: result.totals.c, fats: result.totals.f }); Alert.alert('Meal logged', 'Nutrition was added to today’s progress.', [{ text: 'Done', onPress: () => navigation.goBack() }]); }
    catch (error) { Alert.alert('Could not log meal', (error as Error).message); }
    finally { setBusy(false); }
  };

  if (!permission) return <View style={styles.center}><ActivityIndicator color={colors.primary}/></View>;
  if (!permission.granted) return <SafeAreaView style={styles.permission}><Ionicons name="camera-outline" size={54} color={colors.primary}/><Text style={styles.permissionTitle}>Camera access required</Text><Text style={styles.permissionText}>TeamCal uses the camera only when you scan a meal or barcode.</Text><TouchableOpacity style={styles.primary} onPress={requestPermission}><Text style={styles.primaryText}>Allow Camera</Text></TouchableOpacity><TouchableOpacity onPress={gallery}><Text style={styles.galleryText}>Choose a food photo instead</Text></TouchableOpacity></SafeAreaView>;

  return <View style={styles.container}><StatusBar barStyle="light-content"/>
    {!photo && <CameraView ref={camera} style={StyleSheet.absoluteFill} facing={facing} enableTorch={flash} barcodeScannerSettings={{ barcodeTypes: ['ean13','ean8','upc_a','upc_e','code128'] }} onBarcodeScanned={mode === 'barcode' && !barcodeLocked ? scanned : undefined}/>} 
    {photo && <Image source={{uri:photo}} style={StyleSheet.absoluteFill} resizeMode="cover"/>}<View style={styles.overlay}/>
    <SafeAreaView style={styles.safe} edges={['top','bottom']}>
      <View style={styles.top}><TouchableOpacity style={styles.circle} onPress={()=>navigation.goBack()}><Ionicons name="close" size={23} color="white"/></TouchableOpacity><View style={styles.tabs}><TouchableOpacity style={[styles.tab,mode==='food'&&styles.activeTab]} onPress={()=>{setMode('food');reset();}}><Text style={styles.tabText}>AI Food</Text></TouchableOpacity><TouchableOpacity style={[styles.tab,mode==='barcode'&&styles.activeTab]} onPress={()=>{setMode('barcode');reset();}}><Text style={styles.tabText}>Barcode</Text></TouchableOpacity></View><TouchableOpacity style={styles.circle} onPress={()=>setFlash(v=>!v)}><Ionicons name={flash?'flash':'flash-outline'} size={21} color="white"/></TouchableOpacity></View>
      {!result && <View style={styles.scanArea}><View style={styles.frame}/><Text style={styles.hint}>{mode==='food'?'Fit the entire meal inside the frame':'Center the product barcode in the frame'}</Text>{busy&&<View style={styles.busy}><ActivityIndicator color="white"/><Text style={styles.busyText}>{mode==='food'?'AI is analyzing nutrition…':'Looking up product…'}</Text></View>}</View>}
      {result ? <ScrollView style={styles.result} contentContainerStyle={styles.resultContent}><View style={styles.resultHeader}><View style={{flex:1}}><Text style={styles.resultTitle}>{result.items.map(i=>i.name).join(', ')}</Text>{result.barcode&&<Text style={styles.code}>Barcode {result.barcode}</Text>}</View><Text style={styles.kcal}>{Math.round(result.totals.kcal)} kcal</Text></View><View style={styles.macros}><Macro label="Protein" value={result.totals.p}/><Macro label="Carbs" value={result.totals.c}/><Macro label="Fat" value={result.totals.f}/></View>{result.items.map((item,index)=><View key={`${item.name}-${index}`} style={styles.item}><View style={{flex:1}}><Text style={styles.itemName}>{item.name}</Text><Text style={styles.itemMeta}>{item.grams}g · {Math.round(item.confidence*100)}% confidence</Text></View><Text style={styles.itemKcal}>{Math.round(item.kcal)} kcal</Text></View>)}<TouchableOpacity style={styles.primary} disabled={busy} onPress={log}><Text style={styles.primaryText}>{busy?'Logging…':'Log Food'}</Text></TouchableOpacity><TouchableOpacity onPress={reset}><Text style={styles.rescan}>Scan Again</Text></TouchableOpacity></ScrollView> : <View style={styles.controls}><TouchableOpacity style={styles.smallControl} onPress={gallery}><Ionicons name="images-outline" size={24} color="white"/><Text style={styles.controlText}>Gallery</Text></TouchableOpacity>{mode==='food'?<TouchableOpacity style={styles.shutter} disabled={busy} onPress={capture}><View style={styles.shutterInner}/></TouchableOpacity>:<View style={styles.barcodeWaiting}><Ionicons name="barcode-outline" size={30} color="white"/></View>}<TouchableOpacity style={styles.smallControl} onPress={()=>setFacing(v=>v==='back'?'front':'back')}><Ionicons name="camera-reverse-outline" size={26} color="white"/><Text style={styles.controlText}>Flip</Text></TouchableOpacity></View>}
    </SafeAreaView></View>;
}

function Macro({label,value}:{label:string;value:number}) { return <View style={styles.macro}><Text style={styles.macroValue}>{Math.round(value)}g</Text><Text style={styles.macroLabel}>{label}</Text></View>; }

const styles=StyleSheet.create({container:{flex:1,backgroundColor:colors.navy},center:{flex:1,alignItems:'center',justifyContent:'center'},overlay:{...StyleSheet.absoluteFill,backgroundColor:'rgba(5,10,25,.3)'},safe:{flex:1,justifyContent:'space-between'},top:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:spacing.lg},circle:{width:42,height:42,borderRadius:21,backgroundColor:'rgba(0,0,0,.45)',alignItems:'center',justifyContent:'center'},tabs:{flexDirection:'row',backgroundColor:'rgba(0,0,0,.4)',borderRadius:radii.pill,padding:3},tab:{paddingHorizontal:16,paddingVertical:8,borderRadius:radii.pill},activeTab:{backgroundColor:colors.primary},tabText:{color:'white',fontWeight:'700',fontSize:12},scanArea:{flex:1,alignItems:'center',justifyContent:'center'},frame:{width:260,height:220,borderWidth:3,borderColor:colors.primary,borderRadius:radii.xl},hint:{color:'white',fontWeight:'600',marginTop:spacing.md,textAlign:'center'},busy:{position:'absolute',backgroundColor:'rgba(0,0,0,.7)',borderRadius:radii.lg,padding:spacing.lg,alignItems:'center'},busyText:{color:'white',marginTop:spacing.sm,fontWeight:'600'},controls:{flexDirection:'row',alignItems:'center',justifyContent:'space-around',padding:spacing.xl},smallControl:{width:64,alignItems:'center'},controlText:{color:'white',fontSize:11,marginTop:4},shutter:{width:76,height:76,borderRadius:38,borderWidth:5,borderColor:'white',alignItems:'center',justifyContent:'center'},shutterInner:{width:58,height:58,borderRadius:29,backgroundColor:colors.primary},barcodeWaiting:{width:76,height:76,borderRadius:38,backgroundColor:'rgba(0,0,0,.5)',alignItems:'center',justifyContent:'center'},result:{maxHeight:'62%',backgroundColor:colors.card,borderTopLeftRadius:radii.xl,borderTopRightRadius:radii.xl},resultContent:{padding:spacing.xl},resultHeader:{flexDirection:'row',gap:spacing.md},resultTitle:{fontSize:18,fontWeight:'800',color:colors.textPrimary},code:{fontSize:11,color:colors.textSecondary,marginTop:4},kcal:{color:colors.primary,fontWeight:'800',fontSize:17},macros:{flexDirection:'row',gap:spacing.sm,marginVertical:spacing.lg},macro:{flex:1,backgroundColor:colors.background,borderRadius:radii.md,padding:spacing.md,alignItems:'center'},macroValue:{fontWeight:'800',color:colors.textPrimary},macroLabel:{fontSize:11,color:colors.textSecondary,marginTop:2},item:{flexDirection:'row',paddingVertical:spacing.md,borderTopWidth:1,borderTopColor:colors.border},itemName:{fontWeight:'700',color:colors.textPrimary},itemMeta:{fontSize:11,color:colors.textSecondary,marginTop:3},itemKcal:{fontWeight:'700',color:colors.textPrimary},primary:{backgroundColor:colors.primary,borderRadius:radii.pill,paddingVertical:spacing.md,alignItems:'center',marginTop:spacing.lg,paddingHorizontal:spacing.xl},primaryText:{color:'white',fontWeight:'800'},rescan:{color:colors.textSecondary,textAlign:'center',fontWeight:'700',marginTop:spacing.md},permission:{flex:1,backgroundColor:colors.background,alignItems:'center',justifyContent:'center',padding:32},permissionTitle:{fontSize:21,fontWeight:'800',color:colors.textPrimary,marginTop:spacing.lg},permissionText:{color:colors.textSecondary,textAlign:'center',marginTop:spacing.sm},galleryText:{color:colors.primary,fontWeight:'700',marginTop:spacing.lg}});
