import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CurvedTabBar from './CurvedTabBar';

const ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  index: { active: 'home', inactive: 'home-outline' },
  stats: { active: 'stats-chart', inactive: 'stats-chart-outline' },
  wallet: { active: 'wallet', inactive: 'wallet-outline' },
  settings: { active: 'settings', inactive: 'settings-outline' },
};

const VISIBLE = new Set(['index', 'stats', 'wallet', 'settings']);

export default function SimpleTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 20);

  const visibleRoutes = state.routes.filter((r) => VISIBLE.has(r.name));
  const activeKey = state.routes[state.index]?.key;

  return (
    <View style={[styles.container, { paddingBottom: bottom }]}> 
      <CurvedTabBar />
      {visibleRoutes.map((route) => {
        const isFocused = route.key === activeKey;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };
        const icon = ICONS[route.name as keyof typeof ICONS] || ICONS.index;
        const name = isFocused ? icon.active : icon.inactive;

        return (
          <Pressable key={route.key} style={styles.item} onPress={onPress} accessibilityRole="button">
            <Ionicons size={28} name={name} color={isFocused ? '#34a853' : '#B0B0B0'} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 0,
    paddingTop: 8,
    height: Platform.select({ ios: 88, default: 88 }),
    // Match old design soft shadow on top edge
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
  item: {
    flex: 1,
    alignItems: 'center',
  },
});
