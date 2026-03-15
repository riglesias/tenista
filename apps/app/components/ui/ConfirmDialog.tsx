import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/lib/utils/theme';

interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface ConfirmDialogState extends ConfirmDialogOptions {
  visible: boolean;
}

let confirmDialogRef: {
  show: (options: ConfirmDialogOptions) => void;
} | null = null;

export const ConfirmDialogContainer = () => {
  const [state, setState] = useState<ConfirmDialogState | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setState(null);
    });
  }, [fadeAnim, scaleAnim]);

  const show = useCallback(
    (options: ConfirmDialogOptions) => {
      setState({ ...options, visible: true });
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 150,
          friction: 10,
        }),
      ]).start();
    },
    [fadeAnim, scaleAnim]
  );

  useEffect(() => {
    confirmDialogRef = { show };

    return () => {
      confirmDialogRef = null;
    };
  }, [show]);

  const handleConfirm = useCallback(() => {
    const onConfirm = state?.onConfirm;
    hide();
    onConfirm?.();
  }, [state, hide]);

  const handleCancel = useCallback(() => {
    const onCancel = state?.onCancel;
    hide();
    onCancel?.();
  }, [state, hide]);

  if (!state) return null;

  const {
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    destructive = false,
  } = state;

  const confirmBg = destructive ? colors.destructive : colors.primary;
  const confirmFg = destructive ? '#ffffff' : colors.primaryForeground;

  return (
    <Modal transparent visible animationType="none" onRequestClose={handleCancel}>
      <Animated.View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          opacity: fadeAnim,
          padding: 20,
        }}
      >
        <TouchableOpacity
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={handleCancel}
          activeOpacity={1}
        />
        <Animated.View
          style={{
            width: '100%',
            maxWidth: 400,
            backgroundColor: colors.background,
            borderRadius: 12,
            padding: 24,
            borderWidth: 1,
            borderColor: colors.border,
            transform: [{ scale: scaleAnim }],
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: colors.foreground,
              marginBottom: 8,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: colors.mutedForeground,
              marginBottom: 24,
              lineHeight: 24,
            }}
          >
            {message}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              gap: 12,
            }}
          >
            <TouchableOpacity
              onPress={handleCancel}
              activeOpacity={0.7}
              style={{
                flex: 1,
                padding: 16,
                borderRadius: 8,
                backgroundColor: colors.secondary,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: colors.secondaryForeground,
                }}
              >
                {cancelText}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirm}
              activeOpacity={0.7}
              style={{
                flex: 1,
                padding: 16,
                borderRadius: 8,
                backgroundColor: confirmBg,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: confirmFg,
                }}
              >
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export const useConfirmDialog = () => {
  const confirm = useCallback((options: ConfirmDialogOptions) => {
    Promise.resolve().then(() => {
      if (confirmDialogRef) {
        confirmDialogRef.show(options);
      }
    });
  }, []);

  return { confirm };
};
