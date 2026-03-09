import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Animated } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/lib/utils/theme';
import { CheckCircle, AlertCircle, Info } from 'lucide-react-native';

type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
  type?: ToastType;
  duration?: number;
}

interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
}

let toastRef: {
  show: (message: string, options?: ToastOptions) => void;
} | null = null;

export const ToastContainer = () => {
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'info', visible: false });
  const [animation] = useState(new Animated.Value(-100));
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const hideTimeoutRef = useRef<NodeJS.Timeout>();

  const show = useCallback((message: string, options: ToastOptions = {}) => {
    const { type = 'info', duration = 3000 } = options;
    
    // Clear any existing hide timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    
    // Use requestAnimationFrame to ensure we're not in render phase
    requestAnimationFrame(() => {
      setToast({ message, type, visible: true });
      
      // Animate in
      Animated.spring(animation, {
        toValue: 0,
        useNativeDriver: true,
        tension: 150,
        friction: 8,
      }).start();

      // Auto hide
      hideTimeoutRef.current = setTimeout(() => {
        Animated.timing(animation, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setToast(prev => ({ ...prev, visible: false }));
        });
      }, duration);
    });
  }, [animation]);

  useEffect(() => {
    toastRef = { show };

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      toastRef = null;
    };
  }, [show]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle size={20} color="#10b981" />;
      case 'error':
        return <AlertCircle size={20} color="#ef4444" />;
      default:
        return <Info size={20} color={colors.primary} />;
    }
  };

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return isDark ? '#064e3b' : '#ecfdf5';
      case 'error':
        return isDark ? '#7f1d1d' : '#fef2f2';
      default:
        return colors.card;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return '#10b981';
      case 'error':
        return '#ef4444';
      default:
        return colors.border;
    }
  };

  if (!toast.visible) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 60,
        left: 16,
        right: 16,
        zIndex: 9999,
        transform: [{ translateY: animation }],
      }}
    >
      <View
        style={{
          backgroundColor: getBackgroundColor(),
          borderWidth: 1,
          borderColor: getBorderColor(),
          borderRadius: 12,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        {getIcon()}
        <Text
          style={{
            color: colors.foreground,
            fontSize: 14,
            fontWeight: '500',
            marginLeft: 12,
            flex: 1,
          }}
        >
          {toast.message}
        </Text>
      </View>
    </Animated.View>
  );
};

export const useAppToast = () => {
  const showToast = useCallback((message: string, options: ToastOptions = {}) => {
    // Defer to next tick to avoid updates during render
    Promise.resolve().then(() => {
      if (toastRef) {
        toastRef.show(message, options);
      }
    });
  }, []);

  return { showToast };
};