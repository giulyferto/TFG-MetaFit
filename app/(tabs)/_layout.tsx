import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { HapticTab } from '@/components/ui/haptic-tab';
import { MetaFitColors } from '@/constants/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({
  icon,
  iconActive,
  focused,
}: {
  icon: IoniconName;
  iconActive: IoniconName;
  focused: boolean;
}) {
  return (
    <View style={[styles.pill, focused && styles.pillActive]}>
      <Ionicons
        name={focused ? iconActive : icon}
        size={22}
        color={focused ? MetaFitColors.button.primary : MetaFitColors.text.tertiary}
      />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: MetaFitColors.button.primary,
        tabBarInactiveTintColor: MetaFitColors.text.tertiary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 88,
          paddingTop: 6,
          paddingBottom: 0,
          backgroundColor: MetaFitColors.background.beige,
          borderTopWidth: 1,
          borderTopColor: MetaFitColors.border.light,
          shadowColor: MetaFitColors.text.primary,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 10,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="home-outline" iconActive="home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="feedback"
        options={{
          title: 'Historial',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="time-outline" iconActive="time" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="consulta"
        options={{
          title: 'Consulta',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="chatbubble-outline" iconActive="chatbubble" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="person-outline" iconActive="person" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="configuracion"
        options={{
          href: null,
          title: 'Configuraciones de usuario',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  pill: {
    width: 52,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  pillActive: {
    backgroundColor: MetaFitColors.background.elevated,
  },
});
