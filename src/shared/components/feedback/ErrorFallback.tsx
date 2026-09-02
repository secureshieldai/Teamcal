/**
 * Error Fallback Components
 * Reusable error UI components
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing } from '../../../theme';

interface ErrorFallbackProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: string;
}

export function ErrorFallback({
  title = 'Something Went Wrong',
  message = 'An error occurred. Please try again.',
  actionLabel = 'Try Again',
  onAction,
  icon = '😕',
}: ErrorFallbackProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      
      {onAction && (
        <TouchableOpacity style={styles.button} onPress={onAction}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function NetworkError({ onRetry }: { onRetry: () => void }) {
  return (
    <ErrorFallback
      title="No Internet Connection"
      message="Please check your internet connection and try again."
      actionLabel="Retry"
      onAction={onRetry}
      icon="📡"
    />
  );
}

export function NotFoundError({ onGoBack }: { onGoBack: () => void }) {
  return (
    <ErrorFallback
      title="Not Found"
      message="The content you're looking for doesn't exist."
      actionLabel="Go Back"
      onAction={onGoBack}
      icon="🔍"
    />
  );
}

export function UnauthorizedError({ onLogin }: { onLogin: () => void }) {
  return (
    <ErrorFallback
      title="Authentication Required"
      message="Please log in to continue."
      actionLabel="Log In"
      onAction={onLogin}
      icon="🔒"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  icon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
    minWidth: 160,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
