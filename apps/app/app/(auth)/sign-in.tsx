'use client'

import AppleSignInButton from '@/components/ui/AppleSignInButton'
import GoogleSignInButton from '@/components/ui/GoogleSignInButton'
import TenistaLogoNoColor from '@/components/ui/TenistaLogoNoColor'
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router'
import { Mail } from 'lucide-react-native'
import React, { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native'
import Svg, { Defs, Line, LinearGradient, Rect, Stop } from 'react-native-svg'
import { useTranslation } from 'react-i18next'

export default function SignIn() {
  const { success, error } = useLocalSearchParams<{ success?: string; error?: string }>()
  const [loading, setLoading] = useState(false)
  const { t } = useTranslation('auth')

  // Handle email confirmation status
  useEffect(() => {
    if (success === 'email_confirmed') {
      Alert.alert(t('alerts.success'), t('alerts.emailConfirmed'))
    } else if (error === 'confirmation_failed') {
      Alert.alert(t('alerts.error'), t('alerts.confirmationFailed'))
    } else if (error === 'invalid_link') {
      Alert.alert(t('alerts.error'), t('alerts.invalidLink'))
    } else if (error === 'reset_failed') {
      Alert.alert(t('alerts.error'), t('alerts.resetFailed'))
    }
  }, [success, error, t])

  // Reset loading state when component is focused
  useFocusEffect(
    useCallback(() => {
      setLoading(false)
    }, [])
  )

  return (
    <View style={{ flex: 1 }}>
      {/* Static gradient background using SVG */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <Svg height="100%" width="100%" style={{ position: 'absolute' }}>
          <Defs>
            <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#84FE0C" stopOpacity="1" />
              <Stop offset="100%" stopColor="#4F9807" stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#grad)" />
          
          {/* Tennis court line */}
          <Line 
            x1="100" 
            y1="-60" 
            x2="500" 
            y2="250"
            stroke="white" 
            strokeWidth="40" 
            opacity="0.9"
          />
        </Svg>
      </View>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20 }}>
          <View style={{ flex: 1, width: '100%', maxWidth: 400, alignSelf: 'center' }}>
          
          {/* Logo - Centered in available space */}
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <TenistaLogoNoColor 
              width={240} 
              height={67} 
              color="#000000"
            />
            <Text style={{
              fontSize: 16,
              color: '#000000',
              textAlign: 'center',
              marginTop: 12,
              fontWeight: '500'
            }}>
              {t('signIn.tagline')}
            </Text>
          </View>

          {/* Bottom Buttons */}
          <View style={{ paddingBottom: 20 }}>
            {/* Continue with Email Button */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.8)',
                borderRadius: 8,
                padding: 16,
              }}
              onPress={() => {
                router.push('/(auth)/email-sign-in')
              }}
              disabled={loading}
            >
              <Mail size={20} color="#000000" style={{ marginRight: 8 }} />
              <Text style={{
                color: '#000000',
                fontSize: 16,
                fontWeight: '600'
              }}>
                {t('signIn.continueWithEmail')}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              marginVertical: 16 
            }}>
              <View style={{ 
                flex: 1, 
                height: 1, 
                backgroundColor: 'rgba(0, 0, 0, 0.3)' 
              }} />
              <Text style={{
                marginHorizontal: 16,
                color: 'rgba(0, 0, 0, 0.7)',
                fontSize: 14
              }}>
                {t('signIn.or')}
              </Text>
              <View style={{ 
                flex: 1, 
                height: 1, 
                backgroundColor: 'rgba(0, 0, 0, 0.3)' 
              }} />
            </View>

            {/* Apple Sign-in Button */}
            <AppleSignInButton 
              disabled={loading} 
              onError={() => setLoading(false)}
            />
            {/* Google Sign-in Button */}
            <GoogleSignInButton 
              disabled={loading} 
              onError={() => setLoading(false)}
            />

            {/* Terms and Privacy Text */}
            <View style={{ marginTop: 24, paddingHorizontal: 8 }}>
              <Text style={{
                color: 'rgba(0, 0, 0, 0.7)',
                fontSize: 12,
                textAlign: 'center',
                lineHeight: 18
              }}>
                {t('signIn.termsPrefix')}{' '}
                <Text
                  style={{
                    color: '#000000',
                    fontWeight: '600'
                  }}
                  onPress={() => Linking.openURL('https://www.tenista.app/terms')}
                >
                  {t('signIn.termsAndConditions')}
                </Text>
                {' '}{t('signIn.and')}{' '}
                <Text
                  style={{
                    color: '#000000',
                    fontWeight: '600'
                  }}
                  onPress={() => Linking.openURL('https://www.tenista.app/terms')}
                >
                  {t('signIn.privacyPolicy')}
                </Text>
                .
              </Text>
            </View>
          </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
} 