import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBottomTabOverflow } from '@/components/ui/TabBarBackground';

type RoutePath = '/(tabs)/income' | '/(tabs)/budget' | '/(tabs)/category';

type MenuItem = {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  route?: RoutePath;
};

const GREEN = '#34a853';

export default function SettingsScreen() {
  const bottom = useBottomTabOverflow();
  const router = useRouter();

  const menuItems: MenuItem[] = [
    { id: '1', title: 'Budget', icon: 'calculator-outline', iconColor: '#8E8E93', route: '/(tabs)/budget' },
    { id: '2', title: 'Category', icon: 'grid-outline', iconColor: '#8E8E93', route: '/(tabs)/category' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: bottom + 40 }}>
        {/* Header with Avatar */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Image
              source={require('../../assets/images/ragu.jpg')}
              style={styles.avatar}
            />
          </View>
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>Ragu Rithvik</Text>
          <Text style={styles.userHandle}>ragurithvik@gmail.com</Text>
        </View>

        {/* Menu List */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <View key={item.id}>
              <Pressable style={styles.menuItem} onPress={() => {
                if (item.route) {
                  console.log('Navigating to:', item.route);
                  router.push(item.route);
                }
              }}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name={item.icon} size={24} color={item.iconColor} />
                </View>
                <Text style={styles.menuTitle}>{item.title}</Text>
              </Pressable>
              {index < menuItems.length - 1 && <View style={styles.separator} />}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: GREEN,
    height: 200,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#34a853',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    resizeMode: 'cover',
  },
  userInfo: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  userHandle: {
    fontSize: 16,
    color: '#34a853',
    fontWeight: '500',
  },
  menuContainer: {
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
    marginLeft: 56,
  },
});
