import { Image } from 'expo-image';
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/ui/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 90,
          paddingBottom: 20,
          paddingTop: 15,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: () => (
            <Image
              source={require('@/assets/images/Icon_Home.png')}
              style={{ width: 35, height: 35 }}
              contentFit="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="feedback"
        options={{
          title: 'Feedback',
          tabBarIcon: () => (
            <Image
              source={require('@/assets/images/Icon_Feedback.png')}
              style={{ width: 42, height: 42 }}
              contentFit="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="configuracion"
        options={{
          title: 'Configuración',
          tabBarIcon: () => (
            <Image
              source={require('@/assets/images/Icon_Settings.png')}
              style={{ width: 60, height: 60 }}
              contentFit="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: () => (
            <Image
              source={require('@/assets/images/Icon_Profile.png')}
              style={{ width: 35, height: 35 }}
              contentFit="contain"
            />
          ),
        }}
      />
    </Tabs>
  );
}
