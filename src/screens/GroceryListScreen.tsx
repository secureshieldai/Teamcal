import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { shoppingService, type ShoppingItem } from '../services/api/shopping.service';
import { colors, radii, spacing, typography } from '../theme';

export default function GroceryListScreen() {
  const navigation = useNavigation(); const [items,setItems]=useState<ShoppingItem[]>([]); const [name,setName]=useState(''); const [qty,setQty]=useState(''); const [busy,setBusy]=useState(false);
  const load=useCallback(()=>shoppingService.list().then(setItems).catch(e=>Alert.alert('Unable to load list',e.message)),[]);
  useFocusEffect(useCallback(()=>{load();},[load])); useEffect(()=>{const t=setInterval(load,15000);return()=>clearInterval(t);},[load]);
  const add=async()=>{if(!name.trim())return;try{setBusy(true);const item=await shoppingService.add(name.trim(),qty.trim()||undefined);setItems(v=>[item,...v]);setName('');setQty('');}catch(e){Alert.alert('Unable to add item',(e as Error).message);}finally{setBusy(false);}};
  const toggle=async(item:ShoppingItem)=>{const checked=!item.checked;setItems(v=>v.map(x=>x.id===item.id?{...x,checked}:x));try{await shoppingService.update(item.id,{checked});}catch(e){load();Alert.alert('Unable to update',(e as Error).message);}};
  const remove=async(id:string)=>{setItems(v=>v.filter(x=>x.id!==id));try{await shoppingService.remove(id);}catch(e){load();Alert.alert('Unable to delete',(e as Error).message);}};
  return <SafeAreaView style={s.safe}><View style={s.header}><TouchableOpacity onPress={()=>navigation.goBack()}><Ionicons name="chevron-back" size={24}/></TouchableOpacity><Text style={s.title}>Grocery List</Text><TouchableOpacity onPress={async()=>{await shoppingService.clearChecked();load();}}><Text style={s.clear}>Clear done</Text></TouchableOpacity></View>
    <View style={s.addRow}><TextInput style={[s.input,{flex:1}]} value={name} onChangeText={setName} placeholder="Add an item" onSubmitEditing={add}/><TextInput style={[s.input,{width:80}]} value={qty} onChangeText={setQty} placeholder="Qty"/><TouchableOpacity style={s.add} onPress={add} disabled={busy}><Ionicons name="add" size={24} color={colors.white}/></TouchableOpacity></View>
    <FlatList data={items} keyExtractor={x=>x.id} contentContainerStyle={s.list} ListEmptyComponent={<Text style={s.empty}>Your grocery list is empty.</Text>} renderItem={({item})=><View style={s.row}><TouchableOpacity onPress={()=>toggle(item)}><Ionicons name={item.checked?'checkbox':'square-outline'} size={24} color={item.checked?colors.primary:colors.textMuted}/></TouchableOpacity><View style={{flex:1}}><Text style={[s.item,item.checked&&s.done]}>{item.name}</Text>{item.qty&&<Text style={s.qty}>{item.qty}</Text>}</View><TouchableOpacity onPress={()=>remove(item.id)}><Ionicons name="trash-outline" size={20} color={colors.macroProtein}/></TouchableOpacity></View>}/>
  </SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:colors.background},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:spacing.lg},title:{...typography.h2,color:colors.textPrimary},clear:{color:colors.primary,fontWeight:'700',fontSize:12},addRow:{flexDirection:'row',gap:spacing.sm,paddingHorizontal:spacing.lg},input:{backgroundColor:colors.card,borderWidth:1,borderColor:colors.border,borderRadius:radii.md,padding:spacing.md},add:{width:48,alignItems:'center',justifyContent:'center',backgroundColor:colors.primary,borderRadius:radii.md},list:{padding:spacing.lg,gap:spacing.sm},row:{flexDirection:'row',alignItems:'center',gap:spacing.md,backgroundColor:colors.card,padding:spacing.md,borderRadius:radii.md},item:{...typography.bodyBold,color:colors.textPrimary},done:{textDecorationLine:'line-through',color:colors.textMuted},qty:{...typography.small,color:colors.textSecondary},empty:{textAlign:'center',color:colors.textMuted,marginTop:40}});
