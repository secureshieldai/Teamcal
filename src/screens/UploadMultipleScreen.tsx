import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { earnService } from '../services/api/earn.service';
import { colors, radii, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'UploadMultiple'>;
type UploadRow = { name: string; status: 'waiting' | 'uploading' | 'done' | 'failed'; error?: string };

export default function UploadMultipleScreen({ navigation }: Props) {
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [busy, setBusy] = useState(false);

  const chooseAndUpload = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'],
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    setBusy(true);
    setRows(result.assets.map(asset => ({ name: asset.name, status: 'waiting' })));
    let completed = 0;
    for (let index = 0; index < result.assets.length; index += 1) {
      const asset = result.assets[index];
      setRows(current => current.map((row, i) => i === index ? { ...row, status: 'uploading' } : row));
      try {
        const upload = await earnService.uploadVideoFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType });
        await earnService.createAsset({
          kind: 'video', subtype: 'upload', title: asset.name.replace(/\.[^.]+$/, ''), status: 'draft',
          metadata: { fileUrl: upload.fileUrl, fileName: upload.fileName, fileSize: upload.fileSize, processingStatus: upload.processingStatus },
        });
        completed += 1;
        setRows(current => current.map((row, i) => i === index ? { ...row, status: 'done' } : row));
      } catch (error) {
        setRows(current => current.map((row, i) => i === index ? { ...row, status: 'failed', error: (error as Error).message } : row));
      }
    }
    setBusy(false);
    Alert.alert('Upload complete', `${completed} of ${result.assets.length} videos were saved as drafts.`);
  };

  return <SafeAreaView style={styles.safe}>
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={25} color={colors.textPrimary} /></TouchableOpacity>
      <Text style={styles.title}>Upload multiple videos</Text><View style={styles.spacer} />
    </View>
    <View style={styles.content}>
      <Text style={styles.copy}>Choose several videos. Each successful upload is stored in your backend library as a draft so you can edit and publish it later.</Text>
      <TouchableOpacity style={styles.button} disabled={busy} onPress={chooseAndUpload}>
        <Ionicons name="cloud-upload-outline" size={22} color={colors.white} />
        <Text style={styles.buttonText}>{busy ? 'Uploading…' : 'Choose videos'}</Text>
      </TouchableOpacity>
      <FlatList data={rows} keyExtractor={(_, index) => String(index)} renderItem={({ item }) => <View style={styles.row}>
        <Ionicons name={item.status === 'done' ? 'checkmark-circle' : item.status === 'failed' ? 'alert-circle' : 'time-outline'} size={20} color={item.status === 'done' ? colors.success : item.status === 'failed' ? colors.macroProtein : colors.primary} />
        <View style={styles.rowText}><Text numberOfLines={1} style={styles.name}>{item.name}</Text><Text style={styles.status}>{item.error || item.status}</Text></View>
      </View>} />
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, header: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg },
  title: { ...typography.h2, flex: 1, textAlign: 'center' }, spacer: { width: 25 }, content: { flex: 1, padding: spacing.lg, gap: spacing.lg },
  copy: { color: colors.textMuted, lineHeight: 21 }, button: { backgroundColor: colors.primary, borderRadius: radii.lg, padding: spacing.md, flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  buttonText: { color: colors.white, fontWeight: '800' }, row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, padding: spacing.md, borderRadius: radii.lg, marginBottom: spacing.sm },
  rowText: { flex: 1 }, name: { color: colors.textPrimary, fontWeight: '700' }, status: { color: colors.textMuted, fontSize: 12, textTransform: 'capitalize' },
});
