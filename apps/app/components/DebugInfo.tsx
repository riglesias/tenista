import React from 'react'
import { View, Text, ScrollView, Platform } from 'react-native'

export function DebugInfo() {
  const envInfo = {
    NODE_ENV: process.env.NODE_ENV,
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
    Platform: Platform.OS,
    allEnvKeys: Object.keys(process.env).filter(k => k.startsWith('EXPO_PUBLIC_')),
  }

  return (
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: '#f0f0f0' }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>Debug Information</Text>
      <View style={{ backgroundColor: 'white', padding: 15, borderRadius: 10 }}>
        <Text style={{ fontFamily: 'monospace' }}>
          {JSON.stringify(envInfo, null, 2)}
        </Text>
      </View>
    </ScrollView>
  )
}