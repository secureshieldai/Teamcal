import React, { useState } from 'react';
import { Alert, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useApiQuery } from '../hooks/useApiQuery';
import { marketplaceService } from '../services/api/marketplace.service';
import { colors, radii, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'MarketplaceDetail'>;
export default function MarketplaceDetailScreen({ route, navigation }: Props) {
  const product = useApiQuery(() => marketplaceService.get(route.params.productId), null, [route.params.productId]);
  const [busy, setBusy] = useState(false);
  const buy = async () => {
    try { setBusy(true); const checkout = await marketplaceService.checkout([route.params.productId]); await Linking.openURL(checkout.checkoutUrl); }
    catch (error) { Alert.alert('Unable to start checkout', (error as Error).message); }
    finally { setBusy(false); }
  };
  const p = product.data;
  return <SafeAreaView style={s.safe}><View style={s.header}><TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={24}/></TouchableOpacity><Text style={s.title}>Product Details</Text><View style={{width:24}}/></View>{p&&<ScrollView contentContainerStyle={s.content}>{p.photo&&<Image source={{uri:p.photo}} style={s.photo}/>}<Text style={s.name}>{p.title}</Text><Text style={s.price}>{p.price_display}</Text><Text style={s.category}>{p.category}</Text><Text style={s.description}>{p.description}</Text><TouchableOpacity style={s.button} onPress={buy} disabled={busy}><Text style={s.buttonText}>{busy?'Opening checkout…':'Buy Now'}</Text></TouchableOpacity></ScrollView>}</SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:colors.background},header:{flexDirection:'row',justifyContent:'space-between',padding:spacing.lg},title:{...typography.h2},content:{padding:spacing.lg},photo:{width:'100%',height:260,borderRadius:radii.xl},name:{...typography.h1,marginTop:spacing.lg},price:{fontSize:22,fontWeight:'800',color:colors.primary,marginTop:spacing.sm},category:{...typography.caption,color:colors.textSecondary,textTransform:'capitalize'},description:{...typography.body,color:colors.textSecondary,lineHeight:22,marginTop:spacing.lg},button:{backgroundColor:colors.primary,borderRadius:radii.pill,padding:spacing.md,alignItems:'center',marginTop:spacing.xl},buttonText:{color:colors.white,fontWeight:'800'}});
