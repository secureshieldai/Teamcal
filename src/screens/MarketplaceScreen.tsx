import React from 'react';
import { Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SearchBar from '../components/SearchBar';
import SectionHeader from '../components/SectionHeader';
import { colors, radii, shadow, spacing, typography } from '../theme';
import { useMarketplace } from '../hooks/useMarketplace';
import type { RootStackParamList } from '../navigation/types';

export default function MarketplaceScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { featuredProducts, topCategories } = useMarketplace();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Marketplace</Text>
        <TouchableOpacity onPress={() => navigation.navigate('MarketplaceOrders')}><Ionicons name="cart-outline" size={22} color={colors.textPrimary} /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SearchBar placeholder="Search products, programs, services..." />

        <SectionHeader title="Featured" actionLabel="See All" style={styles.sectionSpacing} />
        <View style={styles.featuredRow}>
          {featuredProducts.map((product) => (
            <TouchableOpacity key={product.id} style={[styles.productCard, shadow.card]} activeOpacity={0.85} onPress={() => navigation.navigate('MarketplaceDetail', { productId: product.id })}>
              <Image source={{ uri: product.photo }} style={styles.productPhoto} />
              <View style={styles.priceBadge}>
                <Text style={styles.priceBadgeText}>{product.price}</Text>
              </View>
              <Text style={styles.productTitle} numberOfLines={2}>
                {product.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <SectionHeader title="Top Categories" style={styles.sectionSpacing} />
        <View style={styles.categoryGrid}>
          {topCategories.map((category) => (
            <TouchableOpacity key={category.id} style={styles.categoryItem} activeOpacity={0.75}>
              <View style={styles.categoryIcon}>
                <Ionicons name={category.icon} size={20} color={colors.primary} />
              </View>
              <Text style={styles.categoryLabel} numberOfLines={2}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  pageTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionSpacing: {
    marginTop: spacing.xl,
  },
  featuredRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  productCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    overflow: 'hidden',
    paddingBottom: spacing.sm,
  },
  productPhoto: {
    width: '100%',
    height: 90,
    backgroundColor: colors.border,
  },
  priceBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.navy,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  priceBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  productTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryItem: {
    width: '20%',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  categoryIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFEDE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
