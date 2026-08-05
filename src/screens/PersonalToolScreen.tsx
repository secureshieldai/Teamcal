import React,{useCallback,useState} from 'react';
import {Alert,FlatList,StyleSheet,Text,TextInput,TouchableOpacity,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/types';
import {personalService,type PersonalRecord} from '../services/api/personal.service';
import {colors,radii,spacing,typography} from '../theme';

type Props=NativeStackScreenProps<RootStackParamList,'PersonalTool'>;
type Item={title:string;details:string;date?:string};

export default function PersonalToolScreen({route,navigation}:Props){
 const {kind}=route.params;const recordKind=kind==='period-tracker'?'period-cycle':'recipe';const [records,setRecords]=useState<PersonalRecord<Item>[]>([]);const [title,setTitle]=useState('');const [details,setDetails]=useState('');
 const load=useCallback(()=>personalService.list<Item>(recordKind).then(setRecords).catch(e=>Alert.alert('Unable to load',(e as Error).message)),[recordKind]);useFocusEffect(useCallback(()=>{load();},[load]));
 const add=async(item?:Item)=>{const value=item||{title:kind==='period-tracker'?'Period started':title.trim(),details:kind==='period-tracker'?'Cycle start recorded':details.trim(),date:new Date().toISOString()};if(!value.title)return;try{await personalService.create(recordKind,value);setTitle('');setDetails('');await load();}catch(e){Alert.alert('Unable to save',(e as Error).message)}};
 const titleText=kind==='recipe-library'?'Recipe Library':kind==='my-recipes'?'My Recipes':'Period Tracker';const data=records.map(r=>r.data);
 return <SafeAreaView style={s.safe}><View style={s.header}><TouchableOpacity onPress={()=>navigation.goBack()}><Ionicons name="chevron-back" size={24}/></TouchableOpacity><Text style={s.heading}>{titleText}</Text><View style={{width:24}}/></View>
 <View style={s.form}>{kind!=='period-tracker'&&<><TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="Recipe name"/><TextInput style={s.input} value={details} onChangeText={setDetails} placeholder="Ingredients and instructions" multiline/></>}<TouchableOpacity style={s.button} onPress={()=>add()}><Text style={s.buttonText}>{kind==='period-tracker'?'Record period start':'Save recipe'}</Text></TouchableOpacity></View>
 <FlatList data={data} keyExtractor={(x,i)=>`${x.title}-${i}`} contentContainerStyle={s.list} ListEmptyComponent={<Text style={s.empty}>No records yet.</Text>} renderItem={({item})=><View style={s.card}><View style={{flex:1}}><Text style={s.itemTitle}>{item.title}</Text><Text style={s.details}>{item.details}</Text>{item.date&&<Text style={s.date}>{new Date(item.date).toLocaleDateString()}</Text>}</View></View>}/></SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:colors.background},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:spacing.lg},heading:{...typography.h2,color:colors.textPrimary},form:{paddingHorizontal:spacing.lg,gap:spacing.sm},input:{backgroundColor:colors.card,borderRadius:radii.lg,padding:spacing.md,color:colors.textPrimary},button:{backgroundColor:colors.primary,borderRadius:radii.pill,padding:spacing.md,alignItems:'center'},buttonText:{color:colors.white,fontWeight:'700'},list:{padding:spacing.lg,gap:spacing.sm},card:{flexDirection:'row',backgroundColor:colors.card,borderRadius:radii.xl,padding:spacing.md},itemTitle:{fontWeight:'700',color:colors.textPrimary},details:{color:colors.textSecondary,marginTop:4},date:{color:colors.textMuted,marginTop:6},save:{color:colors.primary,fontWeight:'700'},empty:{textAlign:'center',color:colors.textMuted}});
