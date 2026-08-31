import React, { useRef, useState } from 'react';
import {
  Alert, Dimensions, Image, Modal, PanResponder, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import ViewShot, { type ViewShotRef } from 'react-native-view-shot';
import { colors, radii, spacing } from '../../theme';
import { postsService } from '../../services/api/posts.service';

const { width: SCREEN_W } = Dimensions.get('window');
const CANVAS_W = SCREEN_W - spacing.lg * 2;
const CANVAS_H = CANVAS_W * (16 / 9);

const BACKGROUNDS: { key: string; colors: [string, string] }[] = [
  { key: 'sunset', colors: ['#FF6A2B', '#FF9F5A'] },
  { key: 'orchid', colors: ['#8B5CF6', '#EC4899'] },
  { key: 'ocean', colors: ['#3B82F6', '#06B6D4'] },
  { key: 'forest', colors: ['#10B981', '#84CC16'] },
  { key: 'midnight', colors: ['#1E293B', '#334155'] },
  { key: 'blush', colors: ['#F472B6', '#FCA5A5'] },
  { key: 'ember', colors: ['#DC2626', '#F59E0B'] },
  { key: 'mono', colors: ['#111111', '#3A3A3A'] },
];

const TEXT_COLORS = ['#FFFFFF', '#111111', '#FF6A2B', '#FDE047', '#34D399', '#60A5FA', '#F472B6'];
type Align = 'left' | 'center' | 'right';

type Mode = 'choose' | 'text' | 'image';

export default function StoryComposer({ visible, onClose, onPosted }: { visible: boolean; onClose: () => void; onPosted: () => void }) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('choose');
  const [bgKey, setBgKey] = useState(BACKGROUNDS[0].key);
  const [imageUri, setImageUri] = useState('');
  const [text, setText] = useState('');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [align, setAlign] = useState<Align>('center');
  const [showTextTools, setShowTextTools] = useState(true);
  const [posting, setPosting] = useState(false);

  const shotRef = useRef<ViewShotRef>(null);
  const pos = useRef({ x: CANVAS_W / 2 - 80, y: CANVAS_H / 2 - 20 }).current;
  const [dragPos, setDragPos] = useState(pos);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_evt, gesture) => {
        setDragPos({
          x: Math.max(0, Math.min(CANVAS_W - 40, pos.x + gesture.dx)),
          y: Math.max(0, Math.min(CANVAS_H - 40, pos.y + gesture.dy)),
        });
      },
      onPanResponderRelease: (_evt, gesture) => {
        pos.x = Math.max(0, Math.min(CANVAS_W - 40, pos.x + gesture.dx));
        pos.y = Math.max(0, Math.min(CANVAS_H - 40, pos.y + gesture.dy));
      },
    })
  ).current;

  const reset = () => {
    setMode('choose'); setBgKey(BACKGROUNDS[0].key); setImageUri(''); setText('');
    setTextColor('#FFFFFF'); setAlign('center'); setShowTextTools(true); setPosting(false);
    pos.x = CANVAS_W / 2 - 80; pos.y = CANVAS_H / 2 - 20; setDragPos({ ...pos });
  };
  const close = () => { reset(); onClose(); };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (result.canceled) return;
    setImageUri(result.assets[0].uri);
    setShowTextTools(false);
    setMode('image');
  };

  const post = async () => {
    if (mode === 'text' && !text.trim()) return Alert.alert('Add some text first');
    if (mode === 'image' && !imageUri) return Alert.alert('Choose an image first');
    setPosting(true);
    try {
      const capturedUri = await shotRef.current?.capture?.();
      if (!capturedUri) throw new Error('Could not render your story. Please try again.');
      const uploadedUrl = await postsService.uploadImage({ uri: capturedUri, mimeType: 'image/jpeg', fileName: 'story.jpg' });
      await postsService.create({ text: '', image: uploadedUrl, community: 'story' });
      onPosted();
      close();
    } catch (e) {
      Alert.alert('Unable to post story', (e as Error).message);
    } finally {
      setPosting(false);
    }
  };

  const activeBg = BACKGROUNDS.find(b => b.key === bgKey) ?? BACKGROUNDS[0];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <View style={[s.safe, { paddingTop: insets.top }]}>
        {mode === 'choose' && (
          <View style={s.chooseWrap}>
            <View style={s.chooseHeader}>
              <TouchableOpacity onPress={close} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={26} color="#fff" />
              </TouchableOpacity>
              <Text style={s.chooseTitle}>Add to Story</Text>
              <View style={{ width: 26 }} />
            </View>
            <View style={s.chooseOptions}>
              <TouchableOpacity style={s.chooseCard} onPress={() => setMode('text')} activeOpacity={0.85}>
                <LinearGradient colors={['#FF6A2B', '#8B5CF6']} style={s.chooseCardBg}>
                  <Ionicons name="text" size={34} color="#fff" />
                </LinearGradient>
                <Text style={s.chooseCardTitle}>Create Text Story</Text>
                <Text style={s.chooseCardSub}>Type on a colored background</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.chooseCard} onPress={pickImage} activeOpacity={0.85}>
                <View style={[s.chooseCardBg, { backgroundColor: '#222' }]}>
                  <Ionicons name="image" size={34} color="#fff" />
                </View>
                <Text style={s.chooseCardTitle}>Upload from Gallery</Text>
                <Text style={s.chooseCardSub}>Pick a photo, then add text</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {(mode === 'text' || mode === 'image') && (
          <View style={{ flex: 1 }}>
            {/* Header */}
            <View style={s.editHeader}>
              <TouchableOpacity onPress={() => setMode('choose')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </TouchableOpacity>
              {mode === 'image' && (
                <TouchableOpacity onPress={() => setShowTextTools(v => !v)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={s.pencilBtn}>
                  <Ionicons name="pencil" size={18} color="#fff" />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[s.postBtn, posting && { opacity: 0.6 }]} onPress={post} disabled={posting}>
                <Text style={s.postBtnText}>{posting ? 'Posting…' : 'Post Story'}</Text>
              </TouchableOpacity>
            </View>

            {/* Canvas */}
            <View style={s.canvasWrap}>
              <ViewShot ref={shotRef} options={{ format: 'jpg', quality: 0.92 }} style={{ width: CANVAS_W, height: CANVAS_H, borderRadius: radii.xl, overflow: 'hidden' }}>
                {mode === 'text' ? (
                  <LinearGradient colors={activeBg.colors} style={StyleSheet.absoluteFill} />
                ) : (
                  <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                )}
                {!!text.trim() && (
                  <View
                    {...panResponder.panHandlers}
                    style={[s.dragText, { left: dragPos.x, top: dragPos.y, maxWidth: CANVAS_W - 24 }]}
                  >
                    <Text style={[s.dragTextInner, { color: textColor, textAlign: align }]}>{text}</Text>
                  </View>
                )}
              </ViewShot>

              {/* Text input overlay (editable, hidden from capture visually since ViewShot renders the View above) */}
              {showTextTools && (
                <View style={s.textInputBar} pointerEvents="box-none">
                  <TextInput
                    style={[s.textInput, { color: textColor, textAlign: align }]}
                    value={text}
                    onChangeText={setText}
                    placeholder="Type something…"
                    placeholderTextColor="rgba(255,255,255,0.7)"
                    multiline
                    autoFocus={mode === 'text'}
                  />
                </View>
              )}
            </View>

            {/* Tools */}
            {showTextTools && (
              <View style={[s.tools, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
                {mode === 'text' && (
                  <>
                    <Text style={s.toolsLabel}>Background</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.swatchRow}>
                      {BACKGROUNDS.map(bg => (
                        <TouchableOpacity key={bg.key} onPress={() => setBgKey(bg.key)}>
                          <LinearGradient colors={bg.colors} style={[s.swatch, bgKey === bg.key && s.swatchActive]} />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </>
                )}
                <Text style={s.toolsLabel}>Text color</Text>
                <View style={s.swatchRow}>
                  {TEXT_COLORS.map(c => (
                    <TouchableOpacity key={c} onPress={() => setTextColor(c)} style={[s.colorDot, { backgroundColor: c }, textColor === c && s.swatchActive]} />
                  ))}
                </View>
                <Text style={s.toolsLabel}>Alignment</Text>
                <View style={s.alignRow}>
                  {(['left', 'center', 'right'] as Align[]).map(a => (
                    <TouchableOpacity key={a} style={[s.alignBtn, align === a && s.alignBtnActive]} onPress={() => setAlign(a)}>
                      <Ionicons name={`text-outline` as any} size={14} color={align === a ? '#fff' : 'rgba(255,255,255,0.6)'} />
                      <Text style={[s.alignBtnText, align === a && { color: '#fff' }]}>{a.charAt(0).toUpperCase() + a.slice(1)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  // Choose screen
  chooseWrap: { flex: 1 },
  chooseHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  chooseTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  chooseOptions: { flex: 1, padding: spacing.lg, gap: spacing.lg, justifyContent: 'center' },
  chooseCard: { alignItems: 'center', gap: spacing.sm },
  chooseCardBg: { width: '100%', height: 160, borderRadius: radii.xl, alignItems: 'center', justifyContent: 'center' },
  chooseCardTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  chooseCardSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  // Edit screen
  editHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  pencilBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  postBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  postBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  canvasWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  dragText: { position: 'absolute' },
  dragTextInner: { fontSize: 22, fontWeight: '800', textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } },
  textInputBar: { position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: spacing.lg },
  textInput: { fontSize: 16, fontWeight: '700', backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: radii.lg, padding: spacing.sm, minHeight: 44 },
  tools: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.xs },
  toolsLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', marginTop: spacing.xs },
  swatchRow: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.xs },
  swatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: 'transparent' },
  swatchActive: { borderColor: '#fff' },
  colorDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
  alignRow: { flexDirection: 'row', gap: spacing.sm, marginTop: 2 },
  alignBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  alignBtnActive: { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: '#fff' },
  alignBtnText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
});
