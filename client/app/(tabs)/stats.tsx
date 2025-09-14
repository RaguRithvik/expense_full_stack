import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useMemo, useState } from 'react';
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

type SpendingItem = {
  id: string;
  name: string;
  date: string;
  amount: string;
  logo: string;
};

const GREEN = '#34a853';

export default function StatsScreen() {
  const bottom = useBottomTabOverflow();
  const [segment, setSegment] = useState<'Day' | 'Week' | 'Month' | 'Year'>('Day');
  const [kind, setKind] = useState<'Expense' | 'Income'>('Expense');

  const items = useMemo<SpendingItem[]>(
    () => [
      {
        id: '1',
        name: 'Starbucks',
        date: 'Jan 12, 2022',
        amount: '- ₹ 150.00',
        logo: 'https://logo.clearbit.com/starbucks.com',
      },
      {
        id: '2',
        name: 'Transfer',
        date: 'Yesterday',
        amount: '- ₹ 85.00',
        logo: 'https://i.pravatar.cc/100?img=11',
      },
      {
        id: '3',
        name: 'Youtube',
        date: 'Jan 16, 2022',
        amount: '- ₹ 11.99',
        logo: 'https://logo.clearbit.com/youtube.com',
      },
    ],
    []
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ paddingBottom: bottom + 40 }}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
          <Text style={styles.title}>Statistics</Text>
          <Ionicons name="share-outline" size={22} color="#1A1A1A" />
        </View>

        {/* Segments & Filter */}
        <View style={styles.rowSpace}>
          <View style={styles.segmentGroup}>
            {(['Day', 'Week', 'Month', 'Year'] as const).map((label) => {
              const active = segment === label;
              return (
                <Pressable
                  key={label}
                  onPress={() => setSegment(label)}
                  style={[styles.segment, active && styles.segmentActive]}
                >
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable style={styles.filterButton} onPress={() => setKind(kind === 'Expense' ? 'Income' : 'Expense')}>
            <Text style={styles.filterText}>{kind}</Text>
          </Pressable>
        </View>

        {/* Chart placeholder */}
        <View style={styles.chartBox}>
          <View style={styles.chartArea} />
          {/* Marker and tooltip */}
          <View style={styles.markerLine} />
          <View style={styles.markerDot} />
          <View style={styles.tooltip}>
                          <Text style={styles.tooltipText}>₹1,230</Text>
          </View>

          {/* Month labels */}
          <View style={styles.monthsRow}>
            {['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'].map((m, i) => (
              <Text key={m} style={[styles.monthLabel, i === 2 && styles.monthActive]}>
                {m}
              </Text>
            ))}
          </View>
        </View>

        {/* Top Spending */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Top Spending</Text>
          <Ionicons name="swap-vertical" size={20} color="#8E8E93" />
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          {items.map((t, idx) => {
            const active = idx === 1;
            return (
              <View key={t.id} style={[styles.cardItem, active && styles.cardItemActive]}>
                <Image source={{ uri: t.logo }} style={styles.cardLogo} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardName, active && styles.cardNameActive]}>{t.name}</Text>
                  <Text style={[styles.cardDate, active && styles.cardDateActive]}>{t.date}</Text>
                </View>
                <Text style={[styles.cardAmount, active && styles.cardAmountActive]}>{t.amount}</Text>
              </View>
            );
          })}
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
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  rowSpace: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  segmentGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#EAEAEA',
  },
  segmentActive: {
    backgroundColor: GREEN,
  },
  segmentText: {
    color: '#2C3A3A',
    fontWeight: '700',
  },
  segmentTextActive: {
    color: '#fff',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D0D5D5',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterText: {
    color: '#2C3A3A',
    fontWeight: '600',
  },
  chartBox: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    backgroundColor: '#F6F8F8',
    paddingVertical: 24,
    paddingHorizontal: 12,
    position: 'relative',
  },
  chartArea: {
    height: 140,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    backgroundColor: 'rgba(52,168,83,0.15)',
    borderTopWidth: 2,
    borderTopColor: GREEN,
  },
  markerLine: {
    position: 'absolute',
    top: 58,
    left: '36%',
    width: 1,
    height: 140,
    backgroundColor: 'rgba(44,58,58,0.25)',
  },
  markerDot: {
    position: 'absolute',
    top: 94,
    left: '34%',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: GREEN,
    borderWidth: 4,
    borderColor: 'rgba(46,130,124,0.35)',
  },
  tooltip: {
    position: 'absolute',
    top: 64,
    left: '24%',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CFE3E0',
  },
  tooltipText: {
    color: GREEN,
    fontWeight: '800',
  },
  monthsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    marginTop: 12,
  },
  monthLabel: {
    color: '#8E8E93',
  },
  monthActive: {
    color: GREEN,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardItemActive: {
    backgroundColor: GREEN,
    shadowColor: GREEN,
    shadowOpacity: 0.3,
    elevation: 6,
  },
  cardLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#F1F4F4',
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  cardNameActive: {
    color: '#fff',
  },
  cardDate: {
    color: '#D0D4D4',
    marginTop: 2,
  },
  cardDateActive: {
    color: '#EAF4F2',
  },
  cardAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#D24C4C',
  },
  cardAmountActive: {
    color: '#fff',
  },
});

