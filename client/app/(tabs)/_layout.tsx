import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Pressable } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import SimpleTabBar from '@/components/ui/SimpleTabBar';

export default function TabLayout() {
  // const colorScheme = useColorScheme();

  return (
    <Tabs
      tabBar={(props) => <SimpleTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: '#34a853',
        tabBarInactiveTintColor: '#B0B0B0',
        headerShown: false,
        tabBarButton: (props) => <HapticTab {...props} />,
        tabBarShowLabel: false,
        tabBarStyle: {
            backgroundColor: 'white',
            borderTopWidth: 0,
            height: 88,
            paddingBottom: 20,
            paddingTop: 8,
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: -5 },
            elevation: 15,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
          },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={28} name={focused ? 'home' : 'home-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={28} name={focused ? 'stats-chart' : 'stats-chart-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={28} name={focused ? 'wallet' : 'wallet-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={28} name={focused ? 'settings' : 'settings-outline'} color={color} />
          ),
        }}
      />
      {/* Hidden routes that still use the common footer */}
      <Tabs.Screen name="income" options={{ tabBarButton: () => null, headerShown: false }} />
      <Tabs.Screen name="budget" options={{ tabBarButton: () => null, headerShown: false }} />
      <Tabs.Screen name="category" options={{ tabBarButton: () => null, headerShown: false }} />
    </Tabs>
  );
}
