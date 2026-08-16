import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { legalDocuments } from '../data/legalDocuments';
import { colors, spacing, typography } from '../theme';

type Props=NativeStackScreenProps<RootStackParamList,'LegalDocument'>;
export default function LegalDocumentScreen({route,navigation}:Props){const doc=legalDocuments[route.params.document];return <SafeAreaView style={s.safe}><View style={s.header}><TouchableOpacity onPress={navigation.goBack}><Ionicons name="chevron-back" size={24} color={colors.textPrimary}/></TouchableOpacity><Text style={s.title}>{doc.title}</Text><View style={{width:24}}/></View><ScrollView contentContainerStyle={s.content}><Text style={s.body}>{doc.body}</Text></ScrollView></SafeAreaView>}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:colors.background},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:spacing.lg,borderBottomWidth:1,borderBottomColor:colors.border},title:{...typography.h2,color:colors.textPrimary},content:{padding:spacing.lg,paddingBottom:spacing.xxl},body:{fontSize:13,color:colors.textPrimary,lineHeight:21}});
