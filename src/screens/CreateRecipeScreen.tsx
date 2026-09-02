import { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radii, shadow, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import { recipeService } from '../services/api/recipe.service';

type Ingredient = { quantity: string; unit: string; name: string };
type Step = { text: string };

export default function CreateRecipeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const [photoUri, setPhotoUri] = useState('');
  const [recipeName, setRecipeName] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ quantity: '', unit: 'cup', name: '' }]);
  const [steps, setSteps] = useState<Step[]>([{ text: '' }]);
  const [saving, setSaving] = useState(false);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { quantity: '', unit: 'cup', name: '' }]);
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const addStep = () => {
    setSteps([...steps, { text: '' }]);
  };

  const updateStep = (index: number, text: string) => {
    const updated = [...steps];
    updated[index] = { text };
    setSteps(updated);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    if (!recipeName.trim()) {
      Alert.alert('Required', 'Please enter a recipe name');
      return;
    }

    if (!prepTime || !cookTime || !servings) {
      Alert.alert('Required', 'Please fill in prep time, cook time, and servings');
      return;
    }

    const hasValidIngredients = ingredients.some(ing => ing.name.trim());
    if (!hasValidIngredients) {
      Alert.alert('Required', 'Please add at least one ingredient');
      return;
    }

    const hasValidSteps = steps.some(step => step.text.trim());
    if (!hasValidSteps) {
      Alert.alert('Required', 'Please add at least one preparation step');
      return;
    }

    setSaving(true);
    try {
      await recipeService.createManual({
        title: recipeName.trim(),
        prepTime: parseInt(prepTime) || 0,
        cookTime: parseInt(cookTime) || 0,
        servings: parseInt(servings) || 1,
        image: photoUri || undefined,
        ingredients: ingredients
          .filter(ing => ing.name.trim())
          .map(ing => `${ing.quantity} ${ing.unit} ${ing.name}`),
        steps: steps.filter(step => step.text.trim()).map(step => step.text),
      });

      Alert.alert('Success', 'Recipe saved successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Recipe</Text>
        <View style={{ width: 22 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.photoBox} onPress={pickPhoto} activeOpacity={0.85}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoImage} />
            ) : (
              <>
                <View style={styles.photoIcon}>
                  <Ionicons name="image-outline" size={28} color={colors.primary} />
                  <View style={styles.cameraIcon}>
                    <Ionicons name="camera" size={14} color={colors.white} />
                  </View>
                </View>
                <Text style={styles.photoTitle}>Add Recipe Photo</Text>
                <Text style={styles.photoSubtitle}>Take a photo or choose from gallery</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={[styles.section, shadow.soft]}>
            <Text style={styles.fieldLabel}>Recipe Name</Text>
            <TextInput
              style={styles.input}
              value={recipeName}
              onChangeText={setRecipeName}
              placeholder="e.g. Mediterranean Chickpea Salad"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.section, shadow.soft, { flex: 1 }]}>
              <View style={styles.iconLabelRow}>
                <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.fieldLabel}>Prep time</Text>
              </View>
              <TextInput
                style={styles.input}
                value={prepTime}
                onChangeText={setPrepTime}
                placeholder="e.g. 15m"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.section, shadow.soft, { flex: 1 }]}>
              <View style={styles.iconLabelRow}>
                <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.fieldLabel}>Cook time</Text>
              </View>
              <TextInput
                style={styles.input}
                value={cookTime}
                onChangeText={setCookTime}
                placeholder="e.g. 15m"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.section, shadow.soft, { flex: 1 }]}>
              <View style={styles.iconLabelRow}>
                <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.fieldLabel}>Servings</Text>
              </View>
              <TextInput
                style={styles.input}
                value={servings}
                onChangeText={setServings}
                placeholder="e.g. 2"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Ingredients</Text>

          {ingredients.map((ing, index) => (
            <View key={index} style={[styles.ingredientCard, shadow.soft]}>
              <View style={styles.ingredientRow}>
                <TextInput
                  style={[styles.input, styles.ingredientInput]}
                  value={ing.quantity}
                  onChangeText={(v) => updateIngredient(index, 'quantity', v)}
                  placeholder="Quantity\ne.g. 1"
                  placeholderTextColor={colors.textMuted}
                />

                <View style={[styles.input, styles.unitPicker]}>
                  <Text style={styles.unitText}>{ing.unit}</Text>
                  <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
                </View>

                <TextInput
                  style={[styles.input, styles.ingredientInput, { flex: 2 }]}
                  value={ing.name}
                  onChangeText={(v) => updateIngredient(index, 'name', v)}
                  placeholder="Ingredient\ne.g. chickpeas"
                  placeholderTextColor={colors.textMuted}
                />

                {ingredients.length > 1 && (
                  <TouchableOpacity onPress={() => removeIngredient(index)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addButton} onPress={addIngredient}>
            <Ionicons name="add" size={16} color={colors.primary} />
            <Text style={styles.addButtonText}>Add Ingredient</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Preparation Steps</Text>

          {steps.map((step, index) => (
            <View key={index} style={[styles.stepCard, shadow.soft]}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                {steps.length > 1 && (
                  <TouchableOpacity onPress={() => removeStep(index)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                style={[styles.input, styles.stepInput]}
                value={step.text}
                onChangeText={(v) => updateStep(index, v)}
                placeholder="Describe this step"
                placeholderTextColor={colors.textMuted}
                multiline
              />
            </View>
          ))}

          <TouchableOpacity style={styles.addButton} onPress={addStep}>
            <Ionicons name="add" size={16} color={colors.primary} />
            <Text style={styles.addButtonText}>Add Step</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Recipe'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  
  photoBox: { height: 160, backgroundColor: '#FDECE4', borderRadius: radii.xl, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photoImage: { width: '100%', height: '100%' },
  photoIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  cameraIcon: { position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  photoTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.sm },
  photoSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  section: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.xs },
  iconLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.xs },
  input: { backgroundColor: colors.background, borderRadius: radii.md, padding: spacing.md, fontSize: 13, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border },

  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginTop: spacing.md },
  
  ingredientCard: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md },
  ingredientRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  ingredientInput: { flex: 1, padding: spacing.sm, minHeight: 40 },
  unitPicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.sm, width: 70 },
  unitText: { fontSize: 12, fontWeight: '600', color: colors.textPrimary },

  stepCard: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md },
  stepHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  stepNumber: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FDECE4', alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { fontSize: 12, fontWeight: '800', color: colors.primary },
  stepInput: { minHeight: 80, textAlignVertical: 'top' },

  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primary, borderRadius: radii.xl, paddingVertical: spacing.md, backgroundColor: '#FFF8F5' },
  addButtonText: { fontSize: 13, fontWeight: '700', color: colors.primary },

  saveButton: { backgroundColor: colors.primary, borderRadius: radii.xl, paddingVertical: spacing.md + 2, alignItems: 'center', marginTop: spacing.lg },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { fontSize: 15, fontWeight: '700', color: colors.white },
});
