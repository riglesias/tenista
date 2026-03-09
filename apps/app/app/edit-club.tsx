'use client'

import { router } from 'expo-router';
import { useEffect } from 'react';

// Redirect to merged edit-homecourt screen
export default function EditClub() {
  useEffect(() => {
    router.replace('/edit-homecourt');
  }, []);

  return null;
}
