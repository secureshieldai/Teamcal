import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { postsService, type PostComment } from '../services/api/posts.service';
import Avatar from '../components/Avatar';
import { colors, radii, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Comments'>;

export default function CommentsScreen({ route, navigation }: Props) {
  const { postId } = route.params;
  const [comments, setComments] = useState<PostComment[]>([]);
  const [value, setValue] = useState('');
  const [posting, setPosting] = useState(false);

  const load = useCallback(() => {
    postsService
      .getComments(postId)
      .then(setComments)
      .catch((error) => Alert.alert('Unable to load comments', error.message));
  }, [postId]);

  useEffect(() => {
    load();
  }, [load]);

  const send = async () => {
    const text = value.trim();
    if (!text || posting) return;
    try {
      setPosting(true);
      const comment = await postsService.addComment(postId, text);
      setComments((current) =>
        current.some((item) => item.id === comment.id) ? current : [...current, comment]
      );
      setValue('');
    } catch (error) {
      Alert.alert('Unable to comment', (error as Error).message);
    } finally {
      setPosting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Comments</Text>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Be the first to comment.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Avatar uri={item.user?.avatar || ''} size={36} />
            <View style={styles.bubble}>
              <Text style={styles.name}>{item.user?.name || 'Member'}</Text>
              <Text style={styles.comment}>{item.meta.text}</Text>
              <Text style={styles.time}>{new Date(item.ts).toLocaleString()}</Text>
            </View>
          </View>
        )}
      />
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={setValue}
          placeholder="Write a comment…"
          multiline
        />
        <TouchableOpacity style={styles.send} onPress={send} disabled={posting}>
          <Ionicons name="send" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg },
  title: { ...typography.h2 },
  list: { padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  bubble: { flex: 1, backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md },
  name: { ...typography.bodyBold },
  comment: { ...typography.body, marginTop: 3, color: colors.textPrimary },
  time: { ...typography.small, color: colors.textMuted, marginTop: 5 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card },
  input: { flex: 1, maxHeight: 100, backgroundColor: colors.background, borderRadius: radii.lg, padding: spacing.md },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
